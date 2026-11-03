<?php

namespace Taily\Support\CaseFile;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Taily\Enums\AdoptionStep;
use Taily\Enums\FieldType;
use Taily\Models\AdoptionFieldValue;
use Taily\Models\AdoptionRequirement;
use Taily\Models\AnimalType;
use Taily\Models\ContractTemplate;
use Taily\Models\FieldDefinition;
use Taily\Models\FieldGroup;

/**
 * Configures an animal type's Case File catalogue: its groups and fields
 * (docs/features/case-file.md). Every animal type has its own catalogue and
 * always contains the built-in fields that identify the applicant.
 */
class FieldCatalogue
{
    /**
     * Fields backed by the adoption's applicant columns (ADR-017). They
     * identify the applicant, so they
     * exist in every catalogue, can be configured but not archived, and keep
     * their type.
     */
    public const BUILT_INS = [
        ['key' => 'first_name', 'label' => 'Vorname', 'type' => 'text', 'required_for' => 'application'],
        ['key' => 'last_name', 'label' => 'Nachname', 'type' => 'text', 'required_for' => 'application'],
        ['key' => 'email', 'label' => 'E-Mail', 'type' => 'email', 'required_for' => 'application'],
        ['key' => 'phone', 'label' => 'Telefon', 'type' => 'phone', 'required_for' => null],
        ['key' => 'mobile', 'label' => 'Mobil', 'type' => 'phone', 'required_for' => null],
        ['key' => 'date_of_birth', 'label' => 'Geburtsdatum', 'type' => 'date', 'required_for' => 'contract'],
        ['key' => 'address', 'label' => 'Anschrift', 'type' => 'address', 'required_for' => 'contract'],
    ];

    /** Built-ins that identify a person and are therefore always asked first. */
    private const IDENTITY = ['first_name', 'last_name', 'email'];

    /**
     * Creates whatever built-in fields an animal type is missing, in a group
     * of their own, so a new animal type starts with a usable catalogue.
     */
    public function ensureBuiltIns(AnimalType $animalType): void
    {
        $existing = FieldDefinition::where('animal_type_id', $animalType->id)
            ->whereNotNull('applicant_attribute')
            ->pluck('key')
            ->all();

        $missing = array_filter(self::BUILT_INS, fn (array $field) => ! in_array($field['key'], $existing, true));

        if ($missing === []) {
            return;
        }

        $group = FieldGroup::where('animal_type_id', $animalType->id)->orderBy('position')->first()
            ?? FieldGroup::create(['animal_type_id' => $animalType->id, 'title' => 'Über dich', 'position' => 0]);

        $position = (int) FieldDefinition::where('field_group_id', $group->id)->max('position') + 1;

        foreach ($missing as $field) {
            FieldDefinition::create([
                'animal_type_id' => $animalType->id,
                'field_group_id' => $group->id,
                'key' => $field['key'],
                'applicant_attribute' => $field['key'],
                'label' => $field['label'],
                'type' => $field['type'],
                'position' => $position++,
                'collect_at' => AdoptionStep::APPLICATION,
                'required_for' => $field['required_for'],
            ]);
        }
    }

    public function createGroup(AnimalType $animalType, array $input): FieldGroup
    {
        $data = $this->validateGroup($input);

        return FieldGroup::create($data + [
            'animal_type_id' => $animalType->id,
            'position' => (int) FieldGroup::where('animal_type_id', $animalType->id)->max('position') + 1,
        ]);
    }

    public function updateGroup(FieldGroup $group, array $input): FieldGroup
    {
        $group->update($this->validateGroup($input));

        return $group;
    }

    /**
     * Only an empty group can go; fields — archived ones included, since they
     * still hold values — have to be moved elsewhere first.
     */
    public function deleteGroup(FieldGroup $group): void
    {
        if ($group->fieldDefinitions()->exists()) {
            throw ValidationException::withMessages([
                'group' => ['Der Abschnitt enthält noch Felder. Verschiebe sie zuerst in einen anderen Abschnitt.'],
            ]);
        }

        $group->delete();
    }

    /**
     * @param  list<string>  $ids  every group of the animal type, in the new order
     */
    public function reorderGroups(AnimalType $animalType, array $ids): void
    {
        $this->reorder(FieldGroup::where('animal_type_id', $animalType->id)->pluck('id')->all(), $ids, FieldGroup::class);
    }

    /**
     * @param  list<string>  $ids  every field of the group, in the new order
     */
    public function reorderFields(FieldGroup $group, array $ids): void
    {
        $this->reorder(FieldDefinition::where('field_group_id', $group->id)->pluck('id')->all(), $ids, FieldDefinition::class);
    }

    public function createField(FieldGroup $group, array $input): FieldDefinition
    {
        $data = $this->validateField($group->animalType, $input, null);

        return FieldDefinition::create($data + [
            'animal_type_id' => $group->animal_type_id,
            'field_group_id' => $group->id,
            'position' => (int) FieldDefinition::where('field_group_id', $group->id)->max('position') + 1,
        ]);
    }

    public function updateField(FieldDefinition $field, array $input): FieldDefinition
    {
        $data = $this->validateField($field->animalType, $input, $field);

        // Moving to another group appends the field there.
        if (isset($data['field_group_id']) && $data['field_group_id'] !== $field->field_group_id) {
            $data['position'] = (int) FieldDefinition::where('field_group_id', $data['field_group_id'])->max('position') + 1;
        }

        $field->update($data);

        return $field;
    }

    /**
     * Archived fields are no longer asked or required; existing values stay
     * and remain visible on the adoptions that have them.
     */
    public function archiveField(FieldDefinition $field): void
    {
        if ($field->isBuiltIn()) {
            throw ValidationException::withMessages([
                'field' => ['Standardfelder können nicht archiviert werden.'],
            ]);
        }

        $dependents = FieldDefinition::active()
            ->where('animal_type_id', $field->animal_type_id)
            ->get()
            ->filter(fn (FieldDefinition $other) => ($other->condition['field'] ?? null) === $field->key);

        if ($dependents->isNotEmpty()) {
            throw ValidationException::withMessages([
                'field' => ['Andere Felder hängen von diesem Feld ab: '.$dependents->pluck('label')->join(', ').'.'],
            ]);
        }

        $templates = ContractTemplate::offeredFor($field->animal_type_id)
            ->get()
            ->filter(fn (ContractTemplate $template) => in_array($field->key, $template->printedKeys(), true));

        if ($templates->isNotEmpty()) {
            throw ValidationException::withMessages([
                'field' => ['Vertragsvorlagen drucken dieses Feld: '.$templates->pluck('name')->join(', ').'.'],
            ]);
        }

        $field->update(['archived_at' => now()]);
    }

    public function restoreField(FieldDefinition $field): void
    {
        $field->update(['archived_at' => null]);
    }

    /**
     * Replaces an animal type's catalogue with a copy of another's. Only
     * possible while the target catalogue holds no adoption data yet.
     */
    public function copy(AnimalType $from, AnimalType $to): void
    {
        if ($from->is($to)) {
            throw ValidationException::withMessages([
                'from_animal_type_id' => ['Eine Tierart kann nicht von sich selbst kopieren.'],
            ]);
        }

        $targetIds = FieldDefinition::where('animal_type_id', $to->id)->pluck('id');

        if (AdoptionFieldValue::whereIn('field_definition_id', $targetIds)->exists()
            || AdoptionRequirement::whereIn('field_definition_id', $targetIds)->exists()) {
            throw ValidationException::withMessages([
                'from_animal_type_id' => ["Für {$to->title} gibt es schon Angaben in Vermittlungen. Der Katalog kann nicht mehr ersetzt werden."],
            ]);
        }

        DB::transaction(function () use ($from, $to) {
            FieldGroup::where('animal_type_id', $to->id)->delete();

            foreach (FieldGroup::where('animal_type_id', $from->id)->with('fieldDefinitions')->orderBy('position')->get() as $group) {
                $copy = $group->replicate(['id'])->fill(['animal_type_id' => $to->id]);
                $copy->save();

                foreach ($group->fieldDefinitions as $field) {
                    $field->replicate(['id'])->fill([
                        'animal_type_id' => $to->id,
                        'field_group_id' => $copy->id,
                    ])->save();
                }
            }

            $this->ensureBuiltIns($to);
        });
    }

    /**
     * @return array{title: string, intro: string}
     */
    private function validateGroup(array $input): array
    {
        $data = Validator::make($input, [
            'title' => ['required', 'string', 'max:255'],
            'intro' => ['nullable', 'string', 'max:2000'],
        ], [], ['title' => 'Titel', 'intro' => 'Einleitung'])->validate();

        return ['title' => $data['title'], 'intro' => $data['intro'] ?? ''];
    }

    /**
     * Validates a field definition. Key and type are fixed once created — a
     * field whose meaning changes gets a new key — and built-in fields only
     * allow their presentation and steps to change.
     *
     * @return array<string, mixed>
     */
    private function validateField(AnimalType $animalType, array $input, ?FieldDefinition $existing): array
    {
        $builtIn = $existing?->isBuiltIn() ?? false;
        $type = $existing?->type ?? FieldType::tryFrom((string) ($input['type'] ?? ''));
        $steps = Rule::enum(AdoptionStep::class);

        $rules = [
            'label' => ['required', 'string', 'max:'.($type === FieldType::INFO ? 2000 : 255)],
            'help' => ['nullable', 'string', 'max:1000'],
            'field_group_id' => ['sometimes', Rule::exists('field_groups', 'id')->where('animal_type_id', $animalType->id)],
            'collect_at' => ['required', $steps],
            'required_for' => ['nullable', $steps],
            'visible_to_applicant' => ['sometimes', 'boolean'],
            'visible_to_inspector' => ['sometimes', 'boolean'],
        ];

        if ($existing === null) {
            $rules['key'] = [
                'required', 'string', 'max:64', 'regex:/^[a-z][a-z0-9_]*$/',
                Rule::notIn(array_column(self::BUILT_INS, 'key')),
                Rule::unique('field_definitions', 'key')->where('animal_type_id', $animalType->id),
            ];
            $rules['type'] = ['required', Rule::in(array_map(
                fn (FieldType $case) => $case->value,
                array_filter(FieldType::cases(), fn (FieldType $case) => $case !== FieldType::ADDRESS),
            ))];
        }

        if (! $builtIn) {
            $rules += [
                'requires_review' => ['sometimes', 'boolean'],
                'condition' => ['nullable', 'array'],
                'condition.field' => ['required_with:condition', 'string'],
                // Checked against the controlling field below; listed so validated() keeps them.
                'condition.equals' => ['sometimes'],
                'condition.in' => ['sometimes', 'array'],
                'condition.in.*' => ['string'],
                'options' => ['nullable', 'array'],
            ];
        }

        if (in_array($type, [FieldType::SELECT, FieldType::RADIO], true) && ! $builtIn) {
            $rules['options.choices'] = ['required', 'array', 'min:1'];
            $rules['options.choices.*.value'] = ['required', 'string', 'max:64', 'distinct'];
            $rules['options.choices.*.label'] = ['required', 'string', 'max:255'];
        }

        if (in_array($type, [FieldType::NUMBER, FieldType::INTEGER], true)) {
            $rules['options.min'] = ['nullable', 'numeric'];
            $rules['options.max'] = ['nullable', 'numeric', 'gte:options.min'];
        }

        $validator = Validator::make($input, $rules, [
            'key.regex' => 'Der Schlüssel darf nur Kleinbuchstaben, Ziffern und Unterstriche enthalten und muss mit einem Buchstaben beginnen.',
            'key.not_in' => 'Dieser Schlüssel ist für ein Standardfeld reserviert.',
            'key.unique' => 'Diesen Schlüssel gibt es für diese Tierart schon.',
            'options.choices.required' => 'Lege mindestens eine Auswahlmöglichkeit an.',
        ], [
            'label' => 'Bezeichnung', 'key' => 'Schlüssel', 'type' => 'Typ',
            'collect_at' => 'Erfragt ab', 'required_for' => 'Pflicht ab',
        ]);

        $validator->after(function ($validator) use ($input, $type, $builtIn, $existing, $animalType) {
            $collectAt = AdoptionStep::tryFrom((string) ($input['collect_at'] ?? ''));
            $requiredFor = AdoptionStep::tryFrom((string) ($input['required_for'] ?? ''));

            if ($collectAt && $requiredFor && ! $collectAt->isAtOrBefore($requiredFor)) {
                $validator->errors()->add('required_for', 'Ein Feld kann nicht verlangt werden, bevor es erfragt wird.');
            }

            if ($type === FieldType::INFO && $requiredFor !== null) {
                $validator->errors()->add('required_for', 'Hinweise können nicht verpflichtend sein.');
            }

            if ($builtIn && in_array($existing->key, self::IDENTITY, true)
                && ($collectAt !== AdoptionStep::APPLICATION || $requiredFor !== AdoptionStep::APPLICATION)) {
                $validator->errors()->add('required_for', 'Name und E-Mail identifizieren die Bewerber:in und werden immer mit der Bewerbung verlangt.');
            }

            if (! $builtIn && ! empty($input['condition'])) {
                $this->validateCondition($validator, $animalType, $input, $existing);
            }
        });

        $data = $validator->validate();

        $result = [
            'label' => $data['label'],
            'help' => $data['help'] ?? '',
            'collect_at' => $data['collect_at'],
            'required_for' => $data['required_for'] ?? null,
            'visible_to_applicant' => $data['visible_to_applicant'] ?? $existing?->visible_to_applicant ?? true,
            'visible_to_inspector' => $data['visible_to_inspector'] ?? $existing?->visible_to_inspector ?? true,
        ];

        if (isset($data['field_group_id'])) {
            $result['field_group_id'] = $data['field_group_id'];
        }

        if ($existing === null) {
            $result['key'] = $data['key'];
            $result['type'] = $data['type'];
        }

        if (! $builtIn) {
            $result['requires_review'] = $data['requires_review'] ?? false;
            $result['condition'] = empty($data['condition']) ? null : array_intersect_key($data['condition'], array_flip(['field', 'equals', 'in']));
            $result['options'] = $this->options($type, $data['options'] ?? null);
        }

        return $result;
    }

    /**
     * A condition depends on one earlier yes/no or choice field of the same
     * animal type, so forms read top to bottom and cycles can't happen.
     */
    private function validateCondition($validator, AnimalType $animalType, array $input, ?FieldDefinition $existing): void
    {
        $condition = $input['condition'];
        $controller = FieldDefinition::active()
            ->where('animal_type_id', $animalType->id)
            ->where('key', $condition['field'] ?? null)
            ->with('fieldGroup')
            ->first();

        if ($controller === null || $controller->is($existing)) {
            $validator->errors()->add('condition.field', 'Das Feld, von dem die Bedingung abhängt, gibt es nicht.');

            return;
        }

        if (! $controller->type->canControlCondition()) {
            $validator->errors()->add('condition.field', 'Bedingungen können nur von Ja/Nein- oder Auswahlfeldern abhängen.');

            return;
        }

        if ($existing !== null) {
            $existing->loadMissing('fieldGroup');
            $own = [$existing->fieldGroup->position, $existing->position];
            $theirs = [$controller->fieldGroup->position, $controller->position];

            if ($theirs >= $own) {
                $validator->errors()->add('condition.field', 'Eine Bedingung kann nur von einem Feld abhängen, das weiter oben steht.');
            }
        }

        if ($controller->type === FieldType::BOOLEAN) {
            if (! array_key_exists('equals', $condition) || ! is_bool($condition['equals'])) {
                $validator->errors()->add('condition.equals', 'Wähle Ja oder Nein.');
            }

            return;
        }

        $values = $condition['in'] ?? null;

        if (! is_array($values) || $values === [] || array_diff($values, array_keys($controller->choices())) !== []) {
            $validator->errors()->add('condition.in', 'Wähle mindestens eine der Auswahlmöglichkeiten.');
        }
    }

    /**
     * @return array<string, mixed>|null
     */
    private function options(?FieldType $type, ?array $options): ?array
    {
        return match ($type) {
            FieldType::SELECT, FieldType::RADIO => ['choices' => array_values(array_map(
                fn (array $choice) => ['value' => (string) $choice['value'], 'label' => (string) $choice['label']],
                $options['choices'] ?? [],
            ))],
            FieldType::NUMBER, FieldType::INTEGER => array_filter([
                'min' => $options['min'] ?? null,
                'max' => $options['max'] ?? null,
            ], fn ($value) => $value !== null) ?: null,
            default => null,
        };
    }

    /**
     * @param  list<string>  $current
     * @param  list<string>  $ids
     * @param  class-string<FieldGroup|FieldDefinition>  $model
     */
    private function reorder(array $current, array $ids, string $model): void
    {
        sort($current);
        $given = $ids;
        sort($given);

        if ($current !== $given) {
            throw ValidationException::withMessages([
                'ids' => ['Die Reihenfolge muss genau die vorhandenen Einträge enthalten.'],
            ]);
        }

        DB::transaction(function () use ($ids, $model) {
            foreach ($ids as $position => $id) {
                $model::whereKey($id)->update(['position' => $position]);
            }
        });
    }
}
