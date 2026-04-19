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
     * Check whether the given array represents a valid JSON Schema structure.
     */
    public function isValidSchema(array $schema): bool
    {
        return isset($schema['type']) || isset($schema['properties']) || isset($schema['$schema']);
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
