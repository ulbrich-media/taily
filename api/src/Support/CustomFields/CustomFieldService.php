<?php

namespace Taily\Support\CustomFields;

use Illuminate\Validation\ValidationException;
use Taily\Enums\CustomFieldEntity;
use Taily\Models\Animal;
use Taily\Models\CustomFieldGroup;
use Taily\Models\Person;
use Taily\Support\JsonSchemaValidator;

/**
 * Validates custom field input and merges it into a record. See "Writing
 * values" in docs/features/custom-fields.md.
 */
class CustomFieldService
{
    public function __construct(
        private CustomFieldDefinitions $definitions,
        private JsonSchemaValidator $validator,
    ) {}

    /**
     * Validate `$input` (key => value) and merge it into the record's
     * `custom_fields`, without saving. The record's scope (animal type,
     * roles) must already reflect the request.
     *
     * Only values that differ from the stored ones are validated, so a value
     * that an older version of the template allowed does not block saving.
     * Required fields are checked for the groups with a changed value, so
     * editing an animal's name does not demand a field that was made
     * required later. On create, every in-scope group of the create section
     * is checked, even when no key was sent.
     *
     * @param  array<string, mixed>  $input
     *
     * @throws ValidationException
     */
    public function apply(Animal|Person $record, array $input, bool $creating = false): void
    {
        $entity = $record->customFieldEntity();
        [$animalTypeId, $roles] = $record->customFieldScope();
        $errors = [];
        $values = $record->getAttribute('custom_fields') ?? [];
        $stored = $values;
        $changed = [];

        foreach ($input as $key => $value) {
            $field = $this->definitions->field($entity, (string) $key);

            if (! $field) {
                $errors["custom_fields.{$key}"] = ['Dieses Feld ist nicht definiert.'];

                continue;
            }

            // Only groups shown for the record take values: in scope, or
            // already holding a value. Out-of-scope fields can be edited or
            // emptied while filled, but not filled anew.
            if (! $field->group->isInScope($animalTypeId, $roles)
                && array_intersect($field->group->keys(), array_keys($stored)) === []
                && ! CustomFieldValues::isEmpty($value)) {
                $errors["custom_fields.{$key}"] = ['Dieses Feld gilt nicht für diesen Datensatz.'];

                continue;
            }

            if (CustomFieldValues::isEmpty($value) || ($field->type() === 'checkbox' && $value === false)) {
                if (array_key_exists($key, $stored)) {
                    $changed[] = (string) $key;
                }
                unset($values[$key]);

                continue;
            }

            $value = $this->coerce($field, $value);

            if (array_key_exists($key, $stored) && CustomFieldValues::same($value, $stored[$key])) {
                continue;
            }

            $changed[] = (string) $key;

            if (! $this->validator->validate(
                ['type' => 'object', 'properties' => [$key => $field->schema]],
                [$key => $value],
            )['valid']) {
                $errors["custom_fields.{$key}"] = ['Der Wert ist ungültig.'];

                continue;
            }

            $values[$key] = $value;
        }

        foreach ($this->groupsToValidate($entity, $changed, $animalTypeId, $roles, $creating) as $group) {
            if (! $group->isInScope($animalTypeId, $roles)) {
                continue;
            }

            foreach ($group->fieldDefinitions() as $field) {
                if ($field->required
                    && ! isset($errors["custom_fields.{$field->key}"])
                    && ! CustomFieldValues::satisfiesRequired($field, $values[$field->key] ?? null)) {
                    $errors["custom_fields.{$field->key}"] = ['Dieses Feld ist erforderlich.'];
                }
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        $record->setAttribute('custom_fields', $values);
    }

    /**
     * @param  list<string>  $changed  the keys whose value changed
     * @param  list<string>  $roles
     * @return list<CustomFieldGroup>
     */
    private function groupsToValidate(CustomFieldEntity $entity, array $changed, ?string $animalTypeId, array $roles, bool $creating): array
    {
        return $this->definitions->groups($entity)
            ->filter(fn (CustomFieldGroup $group) => array_intersect($group->keys(), $changed) !== []
                || ($creating && $group->section === CustomFieldEntity::CREATE_SECTION && $group->isInScope($animalTypeId, $roles)))
            ->values()
            ->all();
    }

    /** Numeric strings for number fields, as sent by plain inputs. */
    private function coerce(CustomFieldDefinition $field, mixed $value): mixed
    {
        if ($field->type() === 'number' && is_string($value) && is_numeric($value)) {
            return str_contains($value, '.') || str_contains(strtolower($value), 'e') ? (float) $value : (int) $value;
        }

        return $value;
    }
}
