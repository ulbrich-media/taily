<?php

namespace Taily\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Taily\Support\JsonSchemaValidator;

class JsonSchemaValidatorTest extends TestCase
{
    private JsonSchemaValidator $validator;

    protected function setUp(): void
    {
        $this->validator = new JsonSchemaValidator;
    }

    // -------------------------------------------------------------------------
    // isValidSchema — valid cases
    // -------------------------------------------------------------------------

    public function test_minimal_object_schema_is_valid(): void
    {
        $schema = ['type' => 'object', 'properties' => []];

        $this->assertTrue($this->validator->isValidSchema($schema));
    }

    public function test_schema_with_string_property_is_valid(): void
    {
        $schema = [
            'type' => 'object',
            'properties' => ['name' => ['type' => 'string']],
        ];

        $this->assertTrue($this->validator->isValidSchema($schema));
    }

    public function test_schema_with_all_valid_types_is_valid(): void
    {
        $schema = [
            'type' => 'object',
            'properties' => [
                'a' => ['type' => 'string'],
                'b' => ['type' => 'number'],
                'c' => ['type' => 'integer'],
                'd' => ['type' => 'boolean'],
                'e' => ['type' => 'array'],
                'f' => ['type' => 'object'],
                'g' => ['type' => 'null'],
            ],
        ];

        $this->assertTrue($this->validator->isValidSchema($schema));
    }

    public function test_schema_with_property_without_type_is_valid(): void
    {
        // Type is optional per JSON Schema spec
        $schema = [
            'type' => 'object',
            'properties' => ['notes' => []],
        ];

        $this->assertTrue($this->validator->isValidSchema($schema));
    }

    public function test_schema_with_enum_is_valid(): void
    {
        $schema = [
            'type' => 'object',
            'properties' => [
                'status' => ['type' => 'string', 'enum' => ['active', 'inactive']],
            ],
        ];

        $this->assertTrue($this->validator->isValidSchema($schema));
    }

    public function test_schema_with_numeric_constraints_is_valid(): void
    {
        $schema = [
            'type' => 'object',
            'properties' => [
                'age' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 120],
                'bio' => ['type' => 'string', 'minLength' => 10, 'maxLength' => 500],
            ],
        ];

        $this->assertTrue($this->validator->isValidSchema($schema));
    }

    public function test_schema_with_required_fields_is_valid(): void
    {
        $schema = [
            'type' => 'object',
            'properties' => [
                'name' => ['type' => 'string'],
                'email' => ['type' => 'string'],
            ],
            'required' => ['name', 'email'],
        ];

        $this->assertTrue($this->validator->isValidSchema($schema));
    }

    public function test_schema_with_extra_top_level_keys_is_valid(): void
    {
        $schema = [
            '$schema' => 'http://json-schema.org/draft-07/schema#',
            'title' => 'My Form',
            'type' => 'object',
            'properties' => ['name' => ['type' => 'string']],
            'additionalProperties' => false,
        ];

        $this->assertTrue($this->validator->isValidSchema($schema));
    }

    // -------------------------------------------------------------------------
    // isValidSchema — invalid top-level structure
    // -------------------------------------------------------------------------

    public function test_schema_without_type_is_invalid(): void
    {
        $schema = ['properties' => ['name' => ['type' => 'string']]];

        $this->assertFalse($this->validator->isValidSchema($schema));
    }

    public function test_schema_with_non_object_type_is_invalid(): void
    {
        $schema = ['type' => 'string', 'properties' => []];

        $this->assertFalse($this->validator->isValidSchema($schema));
    }

    public function test_schema_with_unrecognised_top_level_type_is_invalid(): void
    {
        $schema = ['type' => 'banana', 'properties' => []];

        $this->assertFalse($this->validator->isValidSchema($schema));
    }

    public function test_schema_without_properties_is_invalid(): void
    {
        $schema = ['type' => 'object'];

        $this->assertFalse($this->validator->isValidSchema($schema));
    }

    public function test_schema_with_non_array_properties_is_invalid(): void
    {
        $schema = ['type' => 'object', 'properties' => 'not an array'];

        $this->assertFalse($this->validator->isValidSchema($schema));
    }

    // -------------------------------------------------------------------------
    // isValidSchema — invalid property definitions
    // -------------------------------------------------------------------------

    public function test_property_with_unrecognised_type_is_invalid(): void
    {
        $schema = [
            'type' => 'object',
            'properties' => ['field' => ['type' => 'banana']],
        ];

        $this->assertFalse($this->validator->isValidSchema($schema));
    }

    public function test_property_that_is_not_an_array_is_invalid(): void
    {
        $schema = [
            'type' => 'object',
            'properties' => ['field' => 'not an array'],
        ];

        $this->assertFalse($this->validator->isValidSchema($schema));
    }

    public function test_property_with_empty_enum_is_invalid(): void
    {
        $schema = [
            'type' => 'object',
            'properties' => ['status' => ['type' => 'string', 'enum' => []]],
        ];

        $this->assertFalse($this->validator->isValidSchema($schema));
    }

    public function test_property_with_non_array_enum_is_invalid(): void
    {
        $schema = [
            'type' => 'object',
            'properties' => ['status' => ['type' => 'string', 'enum' => 'active']],
        ];

        $this->assertFalse($this->validator->isValidSchema($schema));
    }

    public function test_property_with_non_numeric_minimum_is_invalid(): void
    {
        $schema = [
            'type' => 'object',
            'properties' => ['age' => ['type' => 'integer', 'minimum' => 'zero']],
        ];

        $this->assertFalse($this->validator->isValidSchema($schema));
    }

    public function test_property_with_non_numeric_maximum_is_invalid(): void
    {
        $schema = [
            'type' => 'object',
            'properties' => ['age' => ['type' => 'integer', 'maximum' => 'hundred']],
        ];

        $this->assertFalse($this->validator->isValidSchema($schema));
    }

    public function test_property_with_non_numeric_min_length_is_invalid(): void
    {
        $schema = [
            'type' => 'object',
            'properties' => ['bio' => ['type' => 'string', 'minLength' => 'ten']],
        ];

        $this->assertFalse($this->validator->isValidSchema($schema));
    }

    public function test_property_with_non_numeric_max_length_is_invalid(): void
    {
        $schema = [
            'type' => 'object',
            'properties' => ['bio' => ['type' => 'string', 'maxLength' => 'hundred']],
        ];

        $this->assertFalse($this->validator->isValidSchema($schema));
    }

    // -------------------------------------------------------------------------
    // isValidSchema — invalid required
    // -------------------------------------------------------------------------

    public function test_required_that_is_not_an_array_is_invalid(): void
    {
        $schema = [
            'type' => 'object',
            'properties' => ['name' => ['type' => 'string']],
            'required' => 'name',
        ];

        $this->assertFalse($this->validator->isValidSchema($schema));
    }

    public function test_required_referencing_missing_property_is_invalid(): void
    {
        $schema = [
            'type' => 'object',
            'properties' => ['name' => ['type' => 'string']],
            'required' => ['name', 'nonexistent'],
        ];

        $this->assertFalse($this->validator->isValidSchema($schema));
    }

    public function test_required_with_non_string_entry_is_invalid(): void
    {
        $schema = [
            'type' => 'object',
            'properties' => ['name' => ['type' => 'string']],
            'required' => [42],
        ];

        $this->assertFalse($this->validator->isValidSchema($schema));
    }

    // -------------------------------------------------------------------------
    // validate — data against schema
    // -------------------------------------------------------------------------

    public function test_valid_data_passes_validation(): void
    {
        $schema = [
            'type' => 'object',
            'properties' => ['name' => ['type' => 'string']],
            'required' => ['name'],
        ];

        $result = $this->validator->validate($schema, ['name' => 'Max']);

        $this->assertTrue($result['valid']);
        $this->assertEmpty($result['errors']);
    }

    public function test_missing_required_field_fails_validation(): void
    {
        $schema = [
            'type' => 'object',
            'properties' => ['name' => ['type' => 'string']],
            'required' => ['name'],
        ];

        $result = $this->validator->validate($schema, []);

        $this->assertFalse($result['valid']);
        $this->assertNotEmpty($result['errors']);
    }

    public function test_wrong_field_type_fails_validation(): void
    {
        $schema = [
            'type' => 'object',
            'properties' => ['age' => ['type' => 'integer']],
        ];

        $result = $this->validator->validate($schema, ['age' => 'not a number']);

        $this->assertFalse($result['valid']);
    }

    public function test_value_not_in_enum_fails_validation(): void
    {
        $schema = [
            'type' => 'object',
            'properties' => [
                'status' => ['type' => 'string', 'enum' => ['active', 'inactive']],
            ],
        ];

        $result = $this->validator->validate($schema, ['status' => 'deleted']);

        $this->assertFalse($result['valid']);
    }

    public function test_value_below_minimum_fails_validation(): void
    {
        $schema = [
            'type' => 'object',
            'properties' => ['age' => ['type' => 'integer', 'minimum' => 18]],
        ];

        $result = $this->validator->validate($schema, ['age' => 16]);

        $this->assertFalse($result['valid']);
    }

    public function test_additional_properties_rejected_when_disallowed(): void
    {
        $schema = [
            'type' => 'object',
            'properties' => ['name' => ['type' => 'string']],
            'additionalProperties' => false,
        ];

        $result = $this->validator->validate($schema, ['name' => 'Max', 'unknown' => 'value']);

        $this->assertFalse($result['valid']);
    }
}
