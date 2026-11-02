<?php

namespace Taily\Support\CaseFile;

/**
 * The adoption-specific input of the checklist: the animal's type, the
 * current values, their review status, the mediator's overrides and the
 * fields the contract templates of the animal's type print.
 */
final readonly class CaseFileState
{
    /**
     * @param  array<string, mixed>  $values  keyed by field key
     * @param  array<string, string|null>  $reviewStatuses  keyed by field key
     * @param  array<string, Override>  $overrides  keyed by field key
     * @param  list<string>  $contractFieldKeys
     */
    public function __construct(
        public ?string $animalTypeId,
        public array $values = [],
        public array $reviewStatuses = [],
        public array $overrides = [],
        public array $contractFieldKeys = [],
    ) {}

    public function value(string $key): mixed
    {
        return $this->values[$key] ?? null;
    }
}
