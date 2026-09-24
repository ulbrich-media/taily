<?php

namespace Taily\Enums;

enum ContractSignerRole: string
{
    case MEDIATOR = 'mediator';
    case ADOPTER = 'adopter';

    /**
     * German label for the signature appendix in the final PDF.
     */
    public function label(): string
    {
        return match ($this) {
            self::MEDIATOR => 'Vermittler:in',
            self::ADOPTER => 'Adoptant:in',
        };
    }
}
