<?php

namespace Taily\Support\CustomFields;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;
use Taily\Enums\CustomFieldEntity;
use Taily\Models\CustomFieldGroup;
use Taily\Support\JsonSchemaValidator;
use Taily\Traits\HasCustomFields;

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
     * On create, every in-scope group of the create section is validated, so
     * its required fields are enforced even when no key was sent. On update,
     * only the groups the input touches are validated.
     *
     * @param  Model&HasCustomFields  $record
     * @param  array<string, mixed>  $input
     *
     * @throws ValidationException
     */
    public function apply(Model $record, array $input, bool $creating = false): void
    {
        $entity = $record->customFieldEntity();
        [$animalTypeId, $roles] = $record->customFieldScope();
        $errors = [];
        $values = $record->custom_fields ?? [];

        foreach ($input as $key => $value) {
            $field = $this->definitions->field($entity, (string) $key);

            if (! $field) {
                $errors["custom_fields.{$key}"] = ['Dieses Feld ist nicht definiert.'];

                continue;
            }

            if (CustomFieldValues::isEmpty($value)) {
                unset($values[$key]);

                continue;
            }

            $value = $this->coerce($field, $value);

            if (! $this->validator->validate(
                ['type' => 'object', 'properties' => [$key => $field->schema]],
                [$key => $value],
            )['valid']) {
                $errors["custom_fields.{$key}"] = ['Der Wert ist ungültig.'];

                continue;
            }

            $values[$key] = $value;
        }

        foreach ($this->groupsToValidate($entity, $input, $animalTypeId, $roles, $creating) as $group) {
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

        $record->custom_fields = $values;
    }

    /**
     * @param  array<string, mixed>  $input
     * @param  list<string>  $roles
     * @return list<CustomFieldGroup>
     */
    private function groupsToValidate(CustomFieldEntity $entity, array $input, ?string $animalTypeId, array $roles, bool $creating): array
    {
        return $this->definitions->groups($entity)
            ->filter(fn (CustomFieldGroup $group) => array_intersect($group->keys(), array_map('strval', array_keys($input))) !== []
                || ($creating && $group->section === CustomFieldEntity::CREATE_SECTION && $group->isInScope($animalTypeId, $roles)))
            ->values()
            ->all();
    }

    /** Numeric strings for number fields, as sent by plain inputs. */
    private function coerce(CustomFieldDefinition $field, mixed $value): mixed
    {
        if ($field->type() === 'number' && is_string($value) && is_numeric($value)) {
            return ($field->schema['type'] ?? null) === 'integer' ? (int) $value : $value + 0;
        }

        return $value;
    }
}
