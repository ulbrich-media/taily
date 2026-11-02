<?php

namespace Taily\Support\CaseFile;

use Taily\Enums\AdoptionStep;

/**
 * What is required for a step of an adoption, and how far each item is.
 */
final readonly class Checklist
{
    /**
     * @param  list<ChecklistItem>  $items
     */
    public function __construct(
        public AdoptionStep $step,
        public array $items,
    ) {}

    public function count(string $status): int
    {
        return count(array_filter($this->items, fn (ChecklistItem $item) => $item->status === $status));
    }

    public function isComplete(): bool
    {
        return $this->count(ChecklistItem::DONE) === count($this->items);
    }

    /**
     * @return list<ChecklistItem>
     */
    public function open(): array
    {
        return array_values(array_filter($this->items, fn (ChecklistItem $item) => $item->status !== ChecklistItem::DONE));
    }

    /**
     * @return array{step: string, complete: bool, missing: int, awaiting_review: int, done: int, items: list<array<string, string>>}
     */
    public function toArray(): array
    {
        return [
            'step' => $this->step->value,
            'complete' => $this->isComplete(),
            'missing' => $this->count(ChecklistItem::MISSING),
            'awaiting_review' => $this->count(ChecklistItem::AWAITING_REVIEW),
            'done' => $this->count(ChecklistItem::DONE),
            'items' => array_map(fn (ChecklistItem $item) => $item->toArray(), $this->items),
        ];
    }
}
