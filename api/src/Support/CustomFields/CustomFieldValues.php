<?php

namespace Taily\Support\CustomFields;

/**
 * Rules for what counts as "no value", shared by validation and the
 * missing-fields check so both agree.
 */
final class CustomFieldValues
{
    /**
     * Empty values are not stored: emptying a field removes its key. A switch
     * that is off is stored as absent too (CustomFieldService), since the UI
     * cannot tell "off" from "never set" and an untouched switch must not
     * keep a group visible.
     */
    public static function isEmpty(mixed $value): bool
    {
        return $value === null || $value === '' || $value === [];
    }

    /**
     * A required checkbox must be checked, the same rule jsonSchemaToZod
     * applies in the frontend. Anything else just must not be empty.
     */
    public static function satisfiesRequired(CustomFieldDefinition $field, mixed $value): bool
    {
        if ($field->type() === 'checkbox') {
            return $value === true;
        }

        return ! self::isEmpty($value);
    }
}
