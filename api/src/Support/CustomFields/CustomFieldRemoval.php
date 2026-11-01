<?php

namespace Taily\Support\CustomFields;

use Taily\Enums\CustomFieldEntity;

/**
 * Values that a change would delete: all values of a key, or only those equal
 * to a removed option.
 */
final class CustomFieldRemoval
{
    public function __construct(
        public readonly CustomFieldEntity $entity,
        public readonly string $key,
        public readonly string $label,
        public readonly ?string $option,
        public readonly int $count = 0,
    ) {}

    public function withCount(int $count): self
    {
        return new self($this->entity, $this->key, $this->label, $this->option, $count);
    }

    /**
     * @return array{key: string, label: string, option: ?string, count: int}
     */
    public function toArray(): array
    {
        return ['key' => $this->key, 'label' => $this->label, 'option' => $this->option, 'count' => $this->count];
    }
}
