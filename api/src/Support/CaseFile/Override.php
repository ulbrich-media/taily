<?php

namespace Taily\Support\CaseFile;

use Taily\Enums\AdoptionStep;

/**
 * A mediator's per-adoption Requirement Override. A waived field is not
 * needed at all; otherwise `requiredFor` replaces the default, where null
 * makes the field optional for this adoption.
 */
final readonly class Override
{
    public function __construct(
        public ?AdoptionStep $requiredFor,
        public bool $waived = false,
    ) {}
}
