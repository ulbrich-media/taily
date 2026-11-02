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
use Taily\Models\FieldDefinition;
use Taily\Models\FieldGroup;
use Taily\Models\Person;
use Taily\Models\User;

/**
 * Reads and writes an adoption's Case File and derives its checklists
 * (docs/features/case-file.md). The rules themselves live in the pure
 * ChecklistCalculator; this class only feeds it from the database.
 */
class CaseFileService
{
    private const ADDRESS_PARTS = ['street_line', 'street_line_additional', 'postal_code', 'city', 'country_code'];

    /** @var array<string, Collection<int, FieldDefinition>> keyed by animal type id */
    private array $definitions = [];

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
    }

    private function animalTypeId(Adoption $adoption): ?string
    {
        $adoption->loadMissing('animal');

        return $adoption->animal?->animal_type_id;
    }

    /**
     * Every field printed by a contract template. All templates are offered
     * for every animal type today, so this is their union (ADR-016).
     *
     * @return list<string>
     */
    public function contractFieldKeys(): array
    {
        return collect(config('taily.contracts', []))
            ->flatMap(fn (array $template) => $template['fields'] ?? [])
            ->unique()
            ->values()
            ->all();
    }

    public function calculator(?string $animalTypeId): ChecklistCalculator
    {
        $specs = $this->definitions($animalTypeId)->map(fn (FieldDefinition $definition) => $definition->toSpec())->all();

        foreach ($this->contractFieldKeys() as $key) {
            if (ContractFieldRegistry::has($key)) {
                $specs[] = ContractFieldRegistry::spec($key);
            }
        }

        return new ChecklistCalculator($specs);
    }

    public function state(Adoption $adoption): CaseFileState
    {
        $adoption->loadMissing(['animal', 'mediator', 'applicant', 'fieldValues', 'requirements']);

        $definitions = $this->definitions($this->animalTypeId($adoption));
        $definitionsById = $definitions->keyBy('id');
        $values = [];
        $reviews = [];

        foreach ($definitions as $definition) {
            if ($definition->isBuiltIn()) {
                $values[$definition->key] = $this->builtInValue($definition, $adoption->applicant);
            }
        }

        foreach ($adoption->fieldValues as $fieldValue) {
            $definition = $definitionsById->get($fieldValue->field_definition_id);

            if ($definition !== null && ! $definition->isBuiltIn()) {
                $values[$definition->key] = $fieldValue->value;
                $reviews[$definition->key] = $fieldValue->review_status;
            }
        }

        foreach ($this->contractFieldKeys() as $key) {
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
            animalTypeId: $adoption->animal?->animal_type_id,
            values: $values,
            reviewStatuses: $reviews,
            overrides: $overrides,
            contractFieldKeys: $this->contractFieldKeys(),
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
     * template prints has to be present, unless the mediator waived it for
     * this adoption (ADR-016). The rest of the contract checklist informs
     * but doesn't block.
     *
     * @throws ValidationException listing what is missing, under `template`
     */
    public function assertContractComplete(Adoption $adoption, string $templateKey): void
    {
        $printed = config('taily.contracts', [])[$templateKey]['fields'] ?? [];

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
     * Writes Case File values as the mediator. The mediator may write every
     * field at any time; values they enter count as reviewed.
     *
     * @param  array<string, mixed>  $values  keyed by field key
     */
    public function update(Adoption $adoption, array $values, User $user): void
    {
        $definitions = $this->definitions($this->animalTypeId($adoption))->keyBy('key');

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

        $adoption->loadMissing('applicant');

        DB::transaction(function () use ($adoption, $values, $definitions, $user) {
            $applicant = $adoption->applicant;

            foreach ($values as $key => $value) {
                $definition = $definitions->get($key);
                $value = $this->normalize($definition, $value);

                if ($definition->isBuiltIn()) {
                    $this->writeBuiltIn($definition, $applicant, $value);

                    continue;
                }

                $present = ChecklistCalculator::isPresent($definition->type, $value);

                AdoptionFieldValue::updateOrCreate(
                    ['adoption_id' => $adoption->id, 'field_definition_id' => $definition->id],
                    [
                        'value' => $value,
                        'review_status' => $definition->requires_review && $present ? AdoptionFieldValue::REVIEW_CONFIRMED : null,
                        'review_note' => '',
                        'reviewed_by' => $definition->requires_review && $present ? $user->id : null,
                        'reviewed_at' => $definition->requires_review && $present ? now() : null,
                    ],
                );
            }

            $applicant?->save();
        });

        $adoption->unsetRelation('fieldValues');
        $adoption->unsetRelation('applicant');
    }

    /**
     * Sets or clears the mediator's override of when a field is required.
     */
    public function setRequirement(Adoption $adoption, FieldDefinition $definition, ?AdoptionStep $requiredFor, bool $waived): void
    {
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

        if (in_array($definition->person_attribute, ['first_name', 'last_name'], true)) {
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
                collect(self::ADDRESS_PARTS)->mapWithKeys(fn (string $part) => [".{$part}" => ['nullable', 'string', 'max:255']])->all(),
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
            FieldType::ADDRESS => $value === null ? null : collect(self::ADDRESS_PARTS)
                ->mapWithKeys(fn (string $part) => [$part => trim((string) ($value[$part] ?? ''))])
                ->all(),
            default => $value,
        };
    }

    private function builtInValue(FieldDefinition $definition, ?Person $person): mixed
    {
        if ($person === null) {
            return null;
        }

        return match ($definition->person_attribute) {
            'address' => collect(self::ADDRESS_PARTS)->mapWithKeys(fn (string $part) => [$part => (string) $person->{$part}])->all(),
            'date_of_birth' => $person->date_of_birth?->format('Y-m-d'),
            default => $person->{$definition->person_attribute},
        };
    }

    private function writeBuiltIn(FieldDefinition $definition, ?Person $person, mixed $value): void
    {
        if ($person === null) {
            return;
        }

        if ($definition->person_attribute === 'address') {
            foreach (self::ADDRESS_PARTS as $part) {
                $person->{$part} = $value[$part] ?? '';
            }

            return;
        }

        // Identity strings follow the empty-strings pattern; a date may be null.
        $person->{$definition->person_attribute} = $definition->person_attribute === 'date_of_birth'
            ? $value
            : (string) ($value ?? '');
    }
}
