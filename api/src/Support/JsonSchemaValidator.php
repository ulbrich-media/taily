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
     * Structural rules (type:object, recognised property types, non-empty enums,
     * numeric constraints, required as string array) are enforced by form-meta-schema.json
     * via the Opis validator. The one rule JSON Schema cannot express — that every
     * required entry names an existing property — is checked here.
     */
    public function isValidSchema(array $schema): bool
    {
        $metaSchema = json_decode(file_get_contents(__DIR__.'/form-meta-schema.json'));
        $validator = new Validator;
        $result = $validator->validate($this->schemaToObject($schema), $metaSchema);

        if (! $result->isValid()) {
            return false;
        }

        // Cross-reference: every required entry must name an existing property.
        foreach ($schema['required'] ?? [] as $field) {
            if (! array_key_exists($field, (array) ($schema['properties'] ?? []))) {
                return false;
            }
        }

        return true;
    }

    /**
     * Recursively convert a PHP schema array to stdClass for Opis.
     * PHP encodes empty arrays as [] (JSON array) rather than {} (JSON object),
     * so empty property maps and property definitions need explicit stdClass conversion.
     * Lists (required, enum) are left as PHP arrays and encode correctly as JSON arrays.
     */
    private function schemaToObject(array $schema): \stdClass
    {
        $obj = new \stdClass;
        foreach ($schema as $key => $value) {
            if ($key === 'properties' && is_array($value)) {
                $props = new \stdClass;
                foreach ($value as $propKey => $propDef) {
                    $props->$propKey = is_array($propDef) ? $this->schemaToObject($propDef) : $propDef;
                }
                $obj->$key = $props;
            } elseif (is_array($value) && ! array_is_list($value)) {
                $obj->$key = $this->schemaToObject($value);
            } else {
                $obj->$key = $value;
            }
        }

        return $obj;
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
