<?php

namespace Taily\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Taily\Support\SchemaChangeAnalyzer;

class SchemaChangeAnalyzerTest extends TestCase
{
    private SchemaChangeAnalyzer $analyzer;

    protected function setUp(): void
    {
        $this->analyzer = new SchemaChangeAnalyzer;
    }

    // -------------------------------------------------------------------------
    // Non-breaking changes
    // -------------------------------------------------------------------------

    public function test_text_only_changes_are_not_breaking(): void
    {
        $old = [
            'title' => 'Dog Application',
            'description' => 'Old description',
            'properties' => [
                'name' => ['type' => 'string', 'title' => 'Name'],
            ],
        ];

        $new = [
            'title' => 'Dog Adoption Application',
            'description' => 'New description',
            'properties' => [
                'name' => ['type' => 'string', 'title' => 'Full Name'],
            ],
        ];

        $this->assertFalse($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_adding_optional_property_is_not_breaking(): void
    {
        $old = [
            'properties' => ['name' => ['type' => 'string']],
            'required' => ['name'],
        ];

        $new = [
            'properties' => [
                'name' => ['type' => 'string'],
                'nickname' => ['type' => 'string'],
            ],
            'required' => ['name'],
        ];

        $this->assertFalse($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_adding_enum_value_is_not_breaking(): void
    {
        $old = [
            'properties' => [
                'status' => ['type' => 'string', 'enum' => ['pending', 'approved']],
            ],
        ];

        $new = [
            'properties' => [
                'status' => ['type' => 'string', 'enum' => ['pending', 'approved', 'rejected']],
            ],
        ];

        $this->assertFalse($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_lowering_minimum_is_not_breaking(): void
    {
        $old = ['properties' => ['age' => ['type' => 'integer', 'minimum' => 18]]];
        $new = ['properties' => ['age' => ['type' => 'integer', 'minimum' => 16]]];

        $this->assertFalse($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_removing_minimum_is_not_breaking(): void
    {
        $old = ['properties' => ['age' => ['type' => 'integer', 'minimum' => 18]]];
        $new = ['properties' => ['age' => ['type' => 'integer']]];

        $this->assertFalse($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_raising_maximum_is_not_breaking(): void
    {
        $old = ['properties' => ['score' => ['type' => 'number', 'maximum' => 100]]];
        $new = ['properties' => ['score' => ['type' => 'number', 'maximum' => 200]]];

        $this->assertFalse($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_removing_maximum_is_not_breaking(): void
    {
        $old = ['properties' => ['score' => ['type' => 'number', 'maximum' => 100]]];
        $new = ['properties' => ['score' => ['type' => 'number']]];

        $this->assertFalse($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_lowering_min_length_is_not_breaking(): void
    {
        $old = ['properties' => ['bio' => ['type' => 'string', 'minLength' => 20]]];
        $new = ['properties' => ['bio' => ['type' => 'string', 'minLength' => 10]]];

        $this->assertFalse($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_removing_min_length_is_not_breaking(): void
    {
        $old = ['properties' => ['bio' => ['type' => 'string', 'minLength' => 20]]];
        $new = ['properties' => ['bio' => ['type' => 'string']]];

        $this->assertFalse($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_raising_max_length_is_not_breaking(): void
    {
        $old = ['properties' => ['bio' => ['type' => 'string', 'maxLength' => 100]]];
        $new = ['properties' => ['bio' => ['type' => 'string', 'maxLength' => 500]]];

        $this->assertFalse($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_removing_max_length_is_not_breaking(): void
    {
        $old = ['properties' => ['bio' => ['type' => 'string', 'maxLength' => 100]]];
        $new = ['properties' => ['bio' => ['type' => 'string']]];

        $this->assertFalse($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_removing_additional_properties_restriction_is_not_breaking(): void
    {
        $old = ['properties' => ['name' => ['type' => 'string']], 'additionalProperties' => false];
        $new = ['properties' => ['name' => ['type' => 'string']]];

        $this->assertFalse($this->analyzer->requiresNewVersion($old, $new));
    }

    // -------------------------------------------------------------------------
    // Breaking changes
    // -------------------------------------------------------------------------

    public function test_removing_property_is_breaking(): void
    {
        $old = [
            'properties' => [
                'name' => ['type' => 'string'],
                'phone' => ['type' => 'string'],
            ],
        ];

        $new = [
            'properties' => ['name' => ['type' => 'string']],
        ];

        $this->assertTrue($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_changing_property_type_is_breaking(): void
    {
        $old = ['properties' => ['age' => ['type' => 'string']]];
        $new = ['properties' => ['age' => ['type' => 'integer']]];

        $this->assertTrue($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_adding_required_field_is_breaking(): void
    {
        $old = [
            'properties' => [
                'name' => ['type' => 'string'],
                'phone' => ['type' => 'string'],
            ],
            'required' => ['name'],
        ];

        $new = [
            'properties' => [
                'name' => ['type' => 'string'],
                'phone' => ['type' => 'string'],
            ],
            'required' => ['name', 'phone'],
        ];

        $this->assertTrue($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_removing_enum_value_is_breaking(): void
    {
        $old = [
            'properties' => [
                'status' => ['type' => 'string', 'enum' => ['pending', 'approved', 'rejected']],
            ],
        ];

        $new = [
            'properties' => [
                'status' => ['type' => 'string', 'enum' => ['pending', 'approved']],
            ],
        ];

        $this->assertTrue($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_raising_minimum_is_breaking(): void
    {
        $old = ['properties' => ['age' => ['type' => 'integer', 'minimum' => 16]]];
        $new = ['properties' => ['age' => ['type' => 'integer', 'minimum' => 18]]];

        $this->assertTrue($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_adding_new_minimum_is_breaking(): void
    {
        $old = ['properties' => ['age' => ['type' => 'integer']]];
        $new = ['properties' => ['age' => ['type' => 'integer', 'minimum' => 18]]];

        $this->assertTrue($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_lowering_maximum_is_breaking(): void
    {
        $old = ['properties' => ['score' => ['type' => 'number', 'maximum' => 200]]];
        $new = ['properties' => ['score' => ['type' => 'number', 'maximum' => 100]]];

        $this->assertTrue($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_adding_new_maximum_is_breaking(): void
    {
        $old = ['properties' => ['score' => ['type' => 'number']]];
        $new = ['properties' => ['score' => ['type' => 'number', 'maximum' => 100]]];

        $this->assertTrue($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_raising_min_length_is_breaking(): void
    {
        $old = ['properties' => ['bio' => ['type' => 'string', 'minLength' => 10]]];
        $new = ['properties' => ['bio' => ['type' => 'string', 'minLength' => 50]]];

        $this->assertTrue($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_adding_new_min_length_is_breaking(): void
    {
        $old = ['properties' => ['bio' => ['type' => 'string']]];
        $new = ['properties' => ['bio' => ['type' => 'string', 'minLength' => 10]]];

        $this->assertTrue($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_lowering_max_length_is_breaking(): void
    {
        $old = ['properties' => ['bio' => ['type' => 'string', 'maxLength' => 500]]];
        $new = ['properties' => ['bio' => ['type' => 'string', 'maxLength' => 100]]];

        $this->assertTrue($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_adding_new_max_length_is_breaking(): void
    {
        $old = ['properties' => ['bio' => ['type' => 'string']]];
        $new = ['properties' => ['bio' => ['type' => 'string', 'maxLength' => 100]]];

        $this->assertTrue($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_adding_additional_properties_restriction_is_breaking(): void
    {
        $old = ['properties' => ['name' => ['type' => 'string']]];
        $new = ['properties' => ['name' => ['type' => 'string']], 'additionalProperties' => false];

        $this->assertTrue($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_removing_format_is_breaking(): void
    {
        $old = ['properties' => ['contact' => ['type' => 'string', 'format' => 'email']]];
        $new = ['properties' => ['contact' => ['type' => 'string']]];

        $this->assertTrue($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_adding_format_is_breaking(): void
    {
        $old = ['properties' => ['contact' => ['type' => 'string']]];
        $new = ['properties' => ['contact' => ['type' => 'string', 'format' => 'email']]];

        $this->assertTrue($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_changing_format_is_breaking(): void
    {
        $old = ['properties' => ['value' => ['type' => 'string', 'format' => 'email']]];
        $new = ['properties' => ['value' => ['type' => 'string', 'format' => 'date']]];

        $this->assertTrue($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_same_format_is_not_breaking(): void
    {
        $old = ['properties' => ['sent_at' => ['type' => 'string', 'format' => 'date']]];
        $new = ['properties' => ['sent_at' => ['type' => 'string', 'format' => 'date', 'title' => 'Sent date']]];

        $this->assertFalse($this->analyzer->requiresNewVersion($old, $new));
    }

    // -------------------------------------------------------------------------
    // Nested object schemas
    // -------------------------------------------------------------------------

    public function test_adding_optional_property_to_nested_object_is_not_breaking(): void
    {
        $old = [
            'properties' => [
                'address' => [
                    'type' => 'object',
                    'properties' => ['street' => ['type' => 'string']],
                    'required' => ['street'],
                ],
            ],
        ];

        $new = [
            'properties' => [
                'address' => [
                    'type' => 'object',
                    'properties' => [
                        'street' => ['type' => 'string'],
                        'city' => ['type' => 'string'],
                    ],
                    'required' => ['street'],
                ],
            ],
        ];

        $this->assertFalse($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_removing_property_from_nested_object_is_breaking(): void
    {
        $old = [
            'properties' => [
                'address' => [
                    'type' => 'object',
                    'properties' => [
                        'street' => ['type' => 'string'],
                        'city' => ['type' => 'string'],
                    ],
                ],
            ],
        ];

        $new = [
            'properties' => [
                'address' => [
                    'type' => 'object',
                    'properties' => ['street' => ['type' => 'string']],
                ],
            ],
        ];

        $this->assertTrue($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_adding_required_field_in_nested_object_is_breaking(): void
    {
        $old = [
            'properties' => [
                'address' => [
                    'type' => 'object',
                    'properties' => [
                        'street' => ['type' => 'string'],
                        'city' => ['type' => 'string'],
                    ],
                    'required' => ['street'],
                ],
            ],
        ];

        $new = [
            'properties' => [
                'address' => [
                    'type' => 'object',
                    'properties' => [
                        'street' => ['type' => 'string'],
                        'city' => ['type' => 'string'],
                    ],
                    'required' => ['street', 'city'],
                ],
            ],
        ];

        $this->assertTrue($this->analyzer->requiresNewVersion($old, $new));
    }

    public function test_changing_type_in_nested_object_is_breaking(): void
    {
        $old = [
            'properties' => [
                'address' => [
                    'type' => 'object',
                    'properties' => ['zip' => ['type' => 'string']],
                ],
            ],
        ];

        $new = [
            'properties' => [
                'address' => [
                    'type' => 'object',
                    'properties' => ['zip' => ['type' => 'integer']],
                ],
            ],
        ];

        $this->assertTrue($this->analyzer->requiresNewVersion($old, $new));
    }
}
