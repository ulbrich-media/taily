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

    // Non-breaking changes

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
            'properties' => [
                'name' => ['type' => 'string'],
            ],
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

    // Breaking changes

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

    public function test_changing_property_type_is_breaking(): void
    {
        $old = [
            'properties' => [
                'age' => ['type' => 'string'],
            ],
        ];

        $new = [
            'properties' => [
                'age' => ['type' => 'integer'],
            ],
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
}
