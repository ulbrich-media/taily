<?php

namespace Taily\Support\CaseFile;

use Taily\Enums\AdoptionStep;

final readonly class ChecklistItem
{
    public const MISSING = 'missing';

    public const AWAITING_REVIEW = 'awaiting_review';

    public const DONE = 'done';

    public function __construct(
        public string $key,
        public string $label,
        public AdoptionStep $requiredFor,
        public string $status,
    ) {}

    /**
     * @return array{key: string, label: string, required_for: string, status: string}
     */
    public function toArray(): array
    {
        return [
            'key' => $this->key,
            'label' => $this->label,
            'required_for' => $this->requiredFor->value,
            'status' => $this->status,
        ];
    }
}
