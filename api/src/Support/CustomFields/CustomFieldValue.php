<?php

namespace Taily\Support\CustomFields;

/**
 * A custom field of one record together with its value, ready for any
 * consumer: contracts, the Public API, exports.
 */
final class CustomFieldValue
{
    public function __construct(
        public readonly CustomFieldDefinition $field,
        public readonly mixed $value,
        public readonly bool $inScope,
    ) {}

    public function display(): string
    {
        return $this->field->display($this->value);
    }

    /**
     * @return array{label: string, type: string, value: mixed, display: string}
     */
    public function toPublicArray(): array
    {
        return [
            'label' => $this->field->label(),
            'type' => $this->field->type(),
            'value' => $this->value,
            'display' => $this->display(),
        ];
    }
}
