<?php

namespace Taily\Support\CaseFile;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Taily\Enums\AdoptionStep;
use Taily\Enums\FieldType;
use Taily\Models\Adoption;
use Taily\Models\AdoptionFieldValue;
use Taily\Models\AdoptionRequirement;
use Taily\Models\ContractTemplate;
use Taily\Models\FieldDefinition;
use Taily\Models\FieldGroup;
use Taily\Models\User;

/**
 * Reads and writes an adoption's Case File and derives its checklists
 * (docs/features/case-file.md). The rules themselves live in the pure
 * ChecklistCalculator; this class only feeds it from the database.
 */
class CaseFileService
{
    /** @var array<string, Collection<int, FieldDefinition>> keyed by animal type id */
    private array $definitions = [];

    /** @var array<string, list<string>> keyed by animal type id */
    private array $contractFieldKeys = [];

    /**
     * The active catalogue of an animal type, in display order. Changes apply
     * live to every running adoption — nothing is snapshotted per adoption.
     *
     * @return Collection<int, FieldDefinition>
     */
    public function definitions(?string $animalTypeId): Collection
    {
        if ($animalTypeId === null) {
            return collect();
        }

        return $this->definitions[$animalTypeId] ??= FieldDefinition::active()
            ->where('animal_type_id', $animalTypeId)
            ->with('fieldGroup')
            ->get()
            ->sortBy(fn (FieldDefinition $definition) => [$definition->fieldGroup->position, $definition->position])
            ->values();
    }

    public function definition(Adoption $adoption, string $key): ?FieldDefinition
    {
        return $this->definitions($this->animalTypeId($adoption))->firstWhere('key', $key);
    }

    /**
     * Forgets the loaded catalogues, e.g. after the configuration changed.
     */
    public function flush(): void
    {
        $this->definitions = [];
        $this->contractFieldKeys = [];
    }

    private function animalTypeId(Adoption $adoption): ?string
    {
        $adoption->loadMissing('animal');

        return $adoption->animal?->animal_type_id;
    }

    /**
     * The fields the active contract templates of an animal type require.
     * Each of them is required for the contract step of every adoption of
     * that type (ADR-017).
     *
     * @return list<string>
     */
    public function contractFieldKeys(?string $animalTypeId): array
    {
        if ($animalTypeId === null) {
            return [];
        }

        return $this->contractFieldKeys[$animalTypeId] ??= ContractTemplate::offeredFor($animalTypeId)
            ->get()
            ->toBase()
            ->flatMap(fn (ContractTemplate $template) => $template->requiredKeys())
            ->unique()
            ->values()
            ->all();
    }

    public function calculator(?string $animalTypeId): ChecklistCalculator
    {
        $specs = $this->definitions($animalTypeId)->map(fn (FieldDefinition $definition) => $definition->toSpec())->all();

        foreach ($this->contractFieldKeys($animalTypeId) as $key) {
            if (ContractFieldRegistry::has($key)) {
                $specs[] = ContractFieldRegistry::spec($key);
            }
        }

        return new ChecklistCalculator($specs);
    }

    public function state(Adoption $adoption): CaseFileState
    {
        $adoption->loadMissing(['animal', 'mediator', 'fieldValues', 'requirements']);

        $animalTypeId = $this->animalTypeId($adoption);
        $definitions = $this->definitions($animalTypeId);
        $contractFieldKeys = $this->contractFieldKeys($animalTypeId);
        $definitionsById = $definitions->keyBy('id');
        $values = [];
        $reviews = [];

        foreach ($definitions as $definition) {
            if ($definition->isBuiltIn()) {
                $values[$definition->key] = $this->builtInValue($definition, $adoption);
            }
        }

        foreach ($adoption->fieldValues as $fieldValue) {
            $definition = $definitionsById->get($fieldValue->field_definition_id);

            if ($definition !== null && ! $definition->isBuiltIn()) {
                $values[$definition->key] = $fieldValue->value;
                $reviews[$definition->key] = $fieldValue->review_status;
            }
        }

        foreach ($contractFieldKeys as $key) {
            if (ContractFieldRegistry::has($key)) {
                $values[$key] = ContractFieldRegistry::value($key, $adoption);
            }
        }

        $overrides = [];

        foreach ($adoption->requirements as $requirement) {
            $definition = $definitionsById->get($requirement->field_definition_id);

            if ($definition !== null) {
                $overrides[$definition->key] = $requirement->toOverride();
            }
        }

        return new CaseFileState(
            animalTypeId: $animalTypeId,
            values: $values,
            reviewStatuses: $reviews,
            overrides: $overrides,
            contractFieldKeys: $contractFieldKeys,
            lockedContractKeys: ContractTemplate::fixedRequiredKeys(),
        );
    }

    public function checklist(Adoption $adoption, AdoptionStep $step): Checklist
    {
        return $this->calculator($this->animalTypeId($adoption))->forStep($this->state($adoption), $step);
    }

    /**
     * The Case File as the adoption page shows it: the catalogue's groups
     * with every field that applies to the animal's type, plus a checklist
     * per step. Conditions are sent along so the edit form can show and hide
     * dependent fields while the mediator types.
     *
     * @return array<string, mixed>
     */
    public function present(Adoption $adoption): array
    {
        $state = $this->state($adoption);
        $calculator = $this->calculator($state->animalTypeId);
        $everything = $calculator->forStep($state, AdoptionStep::HANDOVER);
        $statuses = collect($everything->items)->mapWithKeys(fn (ChecklistItem $item) => [$item->key => $item->status]);
        $requirements = $adoption->requirements->keyBy('field_definition_id');
        $fieldValues = $adoption->fieldValues->keyBy('field_definition_id');

        $groups = FieldGroup::where('animal_type_id', $state->animalTypeId)->orderBy('position')->get()->map(function (FieldGroup $group) use ($state, $calculator, $statuses, $requirements, $fieldValues) {
            $fields = $this->definitions($state->animalTypeId)
                ->where('field_group_id', $group->id)
                ->map(function (FieldDefinition $definition) use ($state, $calculator, $statuses, $requirements, $fieldValues) {
                    $spec = $definition->toSpec();
                    $requirement = $requirements->get($definition->id);
                    $fieldValue = $fieldValues->get($definition->id);

                    return [
                        'key' => $definition->key,
                        'label' => $definition->label,
                        'help' => $definition->help,
                        'type' => $definition->type->value,
                        'options' => $definition->options,
                        'built_in' => $definition->isBuiltIn(),
                        'collect_at' => $definition->collect_at->value,
                        'required_for' => $definition->required_for?->value,
                        'effective_required_for' => $calculator->effectiveRequiredFor($spec, $state)?->value,
                        'in_contract' => in_array($definition->key, $state->contractFieldKeys, true),
                        'fixed_in_contract' => ContractTemplate::isFixed($definition->key),
                        'condition' => $definition->condition,
                        'applies' => $calculator->applies($spec, $state),
                        'requires_review' => $definition->requires_review,
                        'visible_to_applicant' => $definition->visible_to_applicant,
                        'visible_to_inspector' => $definition->visible_to_inspector,
                        'value' => $state->value($definition->key),
                        'review_status' => $state->reviewStatuses[$definition->key] ?? null,
                        'override' => $requirement ? [
                            'required_for' => $requirement->required_for?->value,
                            'waived' => $requirement->waived,
                        ] : null,
                        'status' => $statuses->get($definition->key),
                        'updated_at' => $fieldValue?->updated_at,
                    ];
                })
                ->values();

            return [
                'id' => $group->id,
                'title' => $group->title,
                'intro' => $group->intro,
                'fields' => $fields,
            ];
        })->filter(fn (array $group) => $group['fields']->isNotEmpty())->values();

        $checklists = [];

        foreach (AdoptionStep::cases() as $step) {
            $checklist = $calculator->forStep($state, $step)->toArray();

            // Built-in animal and mediator fields are fixed elsewhere — say where.
            foreach ($checklist['items'] as &$item) {
                $item['subject'] = ContractFieldRegistry::has($item['key'])
                    ? ContractFieldRegistry::subject($item['key'])
                    : 'case_file';
            }

            $checklists[$step->value] = $checklist;
        }

        return [
            'groups' => $groups,
            'checklists' => $checklists,
        ];
    }

    /**
     * A contract can't be generated with blanks: every field the chosen
     * template requires has to be present, unless the mediator waived it for
     * this adoption (ADR-017). The rest of the contract checklist informs
     * but doesn't block.
     *
     * @throws ValidationException listing what is missing, under `template`
     */
    public function assertContractComplete(Adoption $adoption, ContractTemplate $template): void
    {
        $printed = $template->requiredKeys();

        $missing = collect($this->checklist($adoption, AdoptionStep::CONTRACT)->open())
            ->filter(fn (ChecklistItem $item) => in_array($item->key, $printed, true))
            ->map(fn (ChecklistItem $item) => $item->label);

        if ($missing->isNotEmpty()) {
            throw ValidationException::withMessages([
                'template' => ['Für den Vertrag fehlen noch: '.$missing->join(', ').'.'],
            ]);
        }
    }

    /**
     * The adoption's Case File values by key, as the contract template reads
     * them.
     *
     * @return array<string, mixed>
     */
    public function values(Adoption $adoption): array
    {
        return $this->state($adoption)->values;
    }

    /**
     * Writes Case File values. The mediator ($user) may write every field at
     * any time, and values they enter count as reviewed. The applicant
     * ($user null) may only write the $only keys the portal allows; a value
     * they change that needs review is pending again.
     *
     * @param  array<string, mixed>  $values  keyed by field key
     * @param  list<string>|null  $only  the keys that may be written, null for all
     */
    public function update(Adoption $adoption, array $values, ?User $user, ?array $only = null): void
    {
        $definitions = $this->definitions($this->animalTypeId($adoption))->keyBy('key');

        if ($only !== null) {
            // Not only(): on an Eloquent collection it matches model ids, not keys.
            $definitions = $definitions->intersectByKeys(array_flip($only));
        }

        $unknown = array_diff(array_keys($values), $definitions->keys()->all());
        $rules = [];

        foreach ($unknown as $key) {
            $rules["values.{$key}"] = ['prohibited'];
        }

        foreach ($values as $key => $value) {
            if ($definitions->has($key)) {
                foreach ($this->rules($definitions->get($key)) as $path => $fieldRules) {
                    $rules["values.{$key}{$path}"] = $fieldRules;
                }
            }
        }

        Validator::make(['values' => $values], $rules, [
            'values.*.prohibited' => 'Dieses Feld kann hier nicht gespeichert werden.',
        ], $this->attributeNames($definitions))->validate();

        DB::transaction(function () use ($adoption, $values, $definitions, $user) {
            foreach ($values as $key => $value) {
                $definition = $definitions->get($key);
                $value = $this->normalize($definition, $value);

                if ($definition->isBuiltIn()) {
                    $this->writeBuiltIn($definition, $adoption, $value);

                    continue;
                }

                $present = ChecklistCalculator::isPresent($definition->type, $value);
                $existing = AdoptionFieldValue::where('adoption_id', $adoption->id)->where('field_definition_id', $definition->id)->first();

                // The applicant saving a value unchanged keeps its review.
                if ($user === null && $existing !== null && $existing->value === $value) {
                    continue;
                }

                $review = match (true) {
                    ! $definition->requires_review || ! $present => null,
                    $user !== null => AdoptionFieldValue::REVIEW_CONFIRMED,
                    default => AdoptionFieldValue::REVIEW_PENDING,
                };

                AdoptionFieldValue::updateOrCreate(
                    ['adoption_id' => $adoption->id, 'field_definition_id' => $definition->id],
                    [
                        'value' => $value,
                        'review_status' => $review,
                        'review_note' => '',
                        'reviewed_by' => $review === AdoptionFieldValue::REVIEW_CONFIRMED ? $user->id : null,
                        'reviewed_at' => $review === AdoptionFieldValue::REVIEW_CONFIRMED ? now() : null,
                    ],
                );
            }

            $adoption->save();
        });

        $adoption->unsetRelation('fieldValues');
    }

    /**
     * Takes over values from another adoption of the same applicant
     * (ADR-018): only fields that are empty here are filled, nothing is
     * overwritten. Fields are matched by key, so a field the other animal
     * type's catalogue also has is taken over too. Files aren't part of the
     * prototype. A value that needs review has to be reviewed again.
     *
     * @return list<string> the labels of the fields that were filled
     */
    public function importFrom(Adoption $adoption, Adoption $source): array
    {
        $targetState = $this->state($adoption);
        $sourceState = $this->state($source);
        $values = [];

        foreach ($this->definitions($this->animalTypeId($adoption)) as $definition) {
            if (! $definition->type->holdsValue() || $definition->type->isFile()) {
                continue;
            }

            $value = $sourceState->value($definition->key);

            if (ChecklistCalculator::isPresent($definition->type, $value)
                && ! ChecklistCalculator::isPresent($definition->type, $targetState->value($definition->key))) {
                $values[$definition->key] = $value;
            }
        }

        if ($values === []) {
            return [];
        }

        $definitions = $this->definitions($this->animalTypeId($adoption))->keyBy('key');

        DB::transaction(function () use ($adoption, $values, $definitions) {
            foreach ($values as $key => $value) {
                $definition = $definitions->get($key);

                if ($definition->isBuiltIn()) {
                    $this->writeBuiltIn($definition, $adoption, $value);

                    continue;
                }

                AdoptionFieldValue::updateOrCreate(
                    ['adoption_id' => $adoption->id, 'field_definition_id' => $definition->id],
                    ['value' => $value, 'review_status' => null, 'review_note' => '', 'reviewed_by' => null, 'reviewed_at' => null],
                );
            }

            $adoption->save();
        });

        $adoption->unsetRelation('fieldValues');

        return collect(array_keys($values))->map(fn (string $key) => $definitions->get($key)->label)->all();
    }

    /**
     * Sets or clears the mediator's override of when a field is required.
     */
    public function setRequirement(Adoption $adoption, FieldDefinition $definition, ?AdoptionStep $requiredFor, bool $waived): void
    {
        if (ContractTemplate::isFixed($definition->key) && ($waived || $requiredFor === null || ! $requiredFor->isAtOrBefore(AdoptionStep::CONTRACT))) {
            throw ValidationException::withMessages([
                'required_for' => ['Jeder Vertrag enthält dieses Feld. Es bleibt spätestens für den Vertrag Pflicht.'],
            ]);
        }

        AdoptionRequirement::updateOrCreate(
            ['adoption_id' => $adoption->id, 'field_definition_id' => $definition->id],
            ['required_for' => $waived ? null : $requiredFor, 'waived' => $waived],
        );

        $adoption->unsetRelation('requirements');
    }

    public function clearRequirement(Adoption $adoption, FieldDefinition $definition): void
    {
        $adoption->requirements()->where('field_definition_id', $definition->id)->delete();
        $adoption->unsetRelation('requirements');
    }

    /**
     * Validation rules per field type, keyed by a path suffix below the
     * field's own key ('' for the field itself).
     *
     * @return array<string, list<mixed>>
     */
    private function rules(FieldDefinition $definition): array
    {
        $options = $definition->options ?? [];
        $range = array_filter([
            isset($options['min']) ? 'min:'.$options['min'] : null,
            isset($options['max']) ? 'max:'.$options['max'] : null,
        ]);

        if (in_array($definition->applicant_attribute, ['first_name', 'last_name'], true)) {
            return ['' => ['required', 'string', 'max:255']];
        }

        return match ($definition->type) {
            FieldType::TEXT => ['' => ['nullable', 'string', 'max:255']],
            FieldType::TEXTAREA => ['' => ['nullable', 'string', 'max:5000']],
            FieldType::NUMBER => ['' => ['nullable', 'numeric', ...$range]],
            FieldType::INTEGER => ['' => ['nullable', 'integer', ...$range]],
            FieldType::BOOLEAN => ['' => ['nullable', 'boolean']],
            FieldType::SELECT, FieldType::RADIO => ['' => ['nullable', 'string', Rule::in(array_keys($definition->choices()))]],
            FieldType::DATE => ['' => ['nullable', 'date_format:Y-m-d']],
            FieldType::EMAIL => ['' => ['nullable', 'email', 'max:255']],
            FieldType::PHONE => ['' => ['nullable', 'string', 'max:50']],
            FieldType::ADDRESS => array_merge(
                ['' => ['nullable', 'array']],
                collect(Adoption::ADDRESS_PARTS)->mapWithKeys(fn (string $part) => [".{$part}" => ['nullable', 'string', 'max:255']])->all(),
            ),
            // Files are not part of the prototype; Info Blocks hold no value.
            FieldType::PHOTO, FieldType::VIDEO, FieldType::DOCUMENT, FieldType::INFO => ['' => ['prohibited']],
        };
    }

    /**
     * @param  Collection<string, FieldDefinition>  $definitions
     * @return array<string, string>
     */
    private function attributeNames(Collection $definitions): array
    {
        return $definitions->mapWithKeys(fn (FieldDefinition $definition, string $key) => ["values.{$key}" => $definition->label])->all();
    }

    private function normalize(FieldDefinition $definition, mixed $value): mixed
    {
        if (is_string($value) && trim($value) === '') {
            return null;
        }

        return match ($definition->type) {
            FieldType::INTEGER => $value === null ? null : (int) $value,
            FieldType::NUMBER => $value === null ? null : (float) $value,
            FieldType::BOOLEAN => $value === null ? null : filter_var($value, FILTER_VALIDATE_BOOLEAN),
            FieldType::TEXT, FieldType::TEXTAREA, FieldType::PHONE, FieldType::EMAIL => $value === null ? null : trim((string) $value),
            FieldType::ADDRESS => $value === null ? null : collect(Adoption::ADDRESS_PARTS)
                ->mapWithKeys(fn (string $part) => [$part => trim((string) ($value[$part] ?? ''))])
                ->all(),
            default => $value,
        };
    }

    /**
     * Built-in fields read the adoption's own applicant columns (ADR-018).
     */
    private function builtInValue(FieldDefinition $definition, Adoption $adoption): mixed
    {
        return match ($definition->applicant_attribute) {
            'address' => collect(Adoption::ADDRESS_PARTS)->mapWithKeys(fn (string $part) => [$part => (string) $adoption->{"applicant_{$part}"}])->all(),
            'date_of_birth' => $adoption->applicant_date_of_birth?->format('Y-m-d'),
            default => $adoption->{"applicant_{$definition->applicant_attribute}"},
        };
    }

    private function writeBuiltIn(FieldDefinition $definition, Adoption $adoption, mixed $value): void
    {
        if ($definition->applicant_attribute === 'address') {
            foreach (Adoption::ADDRESS_PARTS as $part) {
                $adoption->{"applicant_{$part}"} = $value[$part] ?? '';
            }

            return;
        }

        // Strings follow the empty-strings pattern; a date may be null.
        $adoption->{"applicant_{$definition->applicant_attribute}"} = $definition->applicant_attribute === 'date_of_birth'
            ? $value
            : (string) ($value ?? '');
    }
}
