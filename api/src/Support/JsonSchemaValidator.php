<?php

namespace Taily\Support;

use Opis\JsonSchema\Errors\ErrorFormatter;
use Opis\JsonSchema\Validator;

class JsonSchemaValidator
{
    /**
     * Validate data against a JSON Schema definition.
     *
     * @param  array  $schema  JSON Schema as array
     * @param  array  $data  Data to validate
     * @return array{valid: bool, errors: array<string, mixed>}
     */
    public function validate(array $schema, array $data): array
    {
        $validator = new Validator;

        $schemaObject = json_decode(json_encode($schema));
        $dataObject = json_decode(json_encode($data));

        $result = $validator->validate($dataObject, $schemaObject);

        if ($result->isValid()) {
            return ['valid' => true, 'errors' => []];
        }

        $formatter = new ErrorFormatter;
        $errors = $formatter->format($result->error(), true);

        return ['valid' => false, 'errors' => $this->flattenErrors($errors)];
    }

    /**
     * Check whether the given array represents a valid form schema.
     *
     * Validates the subset of JSON Schema Draft-07 that the form builder produces:
     * - Top level must be type:object with a properties map
     * - Each property type, if set, must be a recognised JSON Schema type
     * - enum values must be non-empty arrays
     * - Numeric constraints must be numeric
     * - required entries must be strings referencing existing properties
     */
    public function isValidSchema(array $schema): bool
    {
        if (($schema['type'] ?? null) !== 'object') {
            return false;
        }

        if (! isset($schema['properties']) || ! is_array($schema['properties'])) {
            return false;
        }

        $validTypes = ['string', 'number', 'integer', 'boolean', 'array', 'object', 'null'];

        foreach ($schema['properties'] as $prop) {
            if (! is_array($prop)) {
                return false;
            }

            if (isset($prop['type']) && ! in_array($prop['type'], $validTypes, true)) {
                return false;
            }

            if (isset($prop['enum']) && (! is_array($prop['enum']) || empty($prop['enum']))) {
                return false;
            }

            foreach (['minimum', 'maximum', 'minLength', 'maxLength'] as $constraint) {
                if (isset($prop[$constraint]) && ! is_numeric($prop[$constraint])) {
                    return false;
                }
            }
        }

        if (isset($schema['required'])) {
            if (! is_array($schema['required'])) {
                return false;
            }

            foreach ($schema['required'] as $field) {
                if (! is_string($field) || ! array_key_exists($field, $schema['properties'])) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Flatten nested error arrays into a simple field => messages format.
     *
     * @param  array<mixed>  $errors
     * @return array<string, string[]>
     */
    private function flattenErrors(array $errors, string $prefix = ''): array
    {
        $flat = [];

        foreach ($errors as $key => $value) {
            $fieldKey = $prefix !== '' ? "{$prefix}.{$key}" : (string) $key;

            if (is_array($value) && isset($value[0]) && is_string($value[0])) {
                $flat[$fieldKey] = $value;
            } elseif (is_array($value)) {
                $flat = array_merge($flat, $this->flattenErrors($value, $fieldKey));
            } else {
                $flat[$fieldKey] = [$value];
            }
        }

        return $flat;
    }
}
