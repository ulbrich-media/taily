<?php

namespace Taily\Support\CustomFields;

use Taily\Models\CustomFieldGroup;

/**
 * One field of a Field Group, read from the bound template's schema and
 * ui_schema. Knows its builder field type, its label and how to format a
 * value the way DynamicFormDisplay does in the frontend.
 */
final class CustomFieldDefinition
{
    /**
     * @param  array<string, mixed>  $schema  the property's JSON Schema fragment
     * @param  array<string, mixed>  $ui  the property's ui_schema entry
     */
    public function __construct(
        public readonly CustomFieldGroup $group,
        public readonly string $key,
        public readonly array $schema,
        public readonly array $ui,
        public readonly bool $required,
    ) {}

    /**
     * @param  array<string, mixed>  $schema
     * @param  array<string, mixed>  $uiSchema
     * @return list<self>
     */
    public static function fromSchema(CustomFieldGroup $group, array $schema, array $uiSchema): array
    {
        $properties = $schema['properties'] ?? [];
        $required = $schema['required'] ?? [];

        // ui:order first (it also lists headings, which have no property),
        // then any property the order does not mention.
        $keys = [];
        foreach ((array) ($uiSchema['ui:order'] ?? []) as $key) {
            if (is_string($key) && array_key_exists($key, $properties)) {
                $keys[] = $key;
            }
        }
        foreach (array_keys($properties) as $key) {
            if (! in_array($key, $keys, true)) {
                $keys[] = $key;
            }
        }

        return array_map(fn (string $key) => new self(
            $group,
            $key,
            (array) $properties[$key],
            (array) ($uiSchema[$key] ?? []),
            in_array($key, $required, true),
        ), $keys);
    }

    public function label(): string
    {
        return (string) ($this->ui['ui:title'] ?? $this->schema['title'] ?? $this->key);
    }

    /**
     * The form builder's field type (text, textarea, number, checkbox,
     * select, radio, date, email, phone), which tells consumers more than the
     * JSON Schema type does.
     */
    public function type(): string
    {
        $widget = $this->ui['ui:widget'] ?? null;

        return match (true) {
            isset($this->schema['enum']) => $widget === 'radio' ? 'radio' : 'select',
            in_array($this->schema['type'] ?? null, ['number', 'integer'], true) => 'number',
            ($this->schema['type'] ?? null) === 'boolean' => 'checkbox',
            ($this->schema['format'] ?? null) === 'date' => 'date',
            ($this->schema['format'] ?? null) === 'email' => 'email',
            ($this->schema['format'] ?? null) === 'phone' => 'phone',
            $widget === 'textarea' => 'textarea',
            default => 'text',
        };
    }

    /**
     * Enum options with their labels, in builder order.
     *
     * @return list<array{value: string, label: string}>
     */
    public function options(): array
    {
        $labels = collect($this->ui['ui:options']['labels'] ?? [])
            ->mapWithKeys(fn ($option) => [(string) ($option['value'] ?? '') => (string) ($option['label'] ?? '')]);

        return array_map(
            fn ($value) => ['value' => (string) $value, 'label' => $labels[(string) $value] ?? (string) $value],
            $this->schema['enum'] ?? [],
        );
    }

    public function isPublic(): bool
    {
        return $this->group->isPublic($this->key);
    }

    /**
     * The value as shown to people: "Ja"/"Nein", the option label, a German
     * date, a German decimal. Unset values are an empty string, except for
     * switches.
     */
    public function display(mixed $value): string
    {
        // A switch that is off is not stored, so unset reads as "Nein".
        if ($this->type() === 'checkbox') {
            return $value === true ? 'Ja' : 'Nein';
        }

        if ($value === null || $value === '') {
            return '';
        }

        return match ($this->type()) {
            'select', 'radio' => collect($this->options())->firstWhere('value', (string) $value)['label'] ?? (string) $value,
            'date' => $this->formatDate((string) $value),
            'number' => is_numeric($value) ? str_replace('.', ',', (string) $value) : (string) $value,
            default => (string) $value,
        };
    }

    private function formatDate(string $value): string
    {
        $date = \DateTimeImmutable::createFromFormat('!Y-m-d', $value);

        return $date ? $date->format('d.m.Y') : $value;
    }
}
