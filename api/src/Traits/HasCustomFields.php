<?php

namespace Taily\Traits;

use Taily\Enums\CustomFieldEntity;
use Taily\Support\CustomFields\CustomFieldDefinitions;
use Taily\Support\CustomFields\CustomFieldValue;
use Taily\Support\CustomFields\CustomFieldValues;

/**
 * Custom field values stored in the record's `custom_fields` JSON column (see
 * docs/features/custom-fields.md). The model has to cast `custom_fields` to
 * an array and default it to '{}' in $attributes.
 */
trait HasCustomFields
{
    abstract public function customFieldEntity(): CustomFieldEntity;

    /**
     * The record's scope: its animal type id, and the person roles it holds.
     *
     * @return array{0: ?string, 1: list<string>}
     */
    abstract public function customFieldScope(): array;

    /**
     * The fields of every group shown for this record, with their values, in
     * section → group position → field order.
     *
     * @return list<CustomFieldValue>
     */
    public function customFields(): array
    {
        $values = $this->getAttribute('custom_fields') ?? [];
        $result = [];

        foreach (app(CustomFieldDefinitions::class)->shownFor($this) as ['group' => $group, 'in_scope' => $inScope]) {
            foreach ($group->fieldDefinitions() as $field) {
                $result[] = new CustomFieldValue($field, $values[$field->key] ?? null, $inScope);
            }
        }

        return $result;
    }

    /** The display value of a field, '' if unset or unknown. */
    public function customField(string $key): string
    {
        $field = app(CustomFieldDefinitions::class)->field($this->customFieldEntity(), $key);

        return $field ? $field->display($this->customFieldValue($key)) : '';
    }

    public function customFieldValue(string $key): mixed
    {
        return ($this->getAttribute('custom_fields') ?? [])[$key] ?? null;
    }

    /**
     * Required fields of in-scope groups that have no value yet.
     *
     * @return list<array{key: string, label: string, section: string}>
     */
    public function customFieldsMissing(): array
    {
        [$animalTypeId, $roles] = $this->customFieldScope();
        $missing = [];

        foreach (app(CustomFieldDefinitions::class)->inScope($this->customFieldEntity(), $animalTypeId, $roles) as $group) {
            foreach ($group->fieldDefinitions() as $field) {
                if ($field->required && ! CustomFieldValues::satisfiesRequired($field, $this->customFieldValue($field->key))) {
                    $missing[] = ['key' => $field->key, 'label' => $field->label(), 'section' => $group->section];
                }
            }
        }

        return $missing;
    }
}
