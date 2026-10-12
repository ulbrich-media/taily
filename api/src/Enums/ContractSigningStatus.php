<?php

namespace Taily\Enums;

enum ContractSigningStatus: string
{
    case AWAITING_MEDIATOR_SIGNATURE = 'awaiting_mediator_signature';
    case AWAITING_ADOPTER_SIGNATURE = 'awaiting_adopter_signature';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
    case EXPIRED = 'expired';

    /**
     * Statuses for a signing process that is still awaiting a signature.
     *
     * @return list<self>
     */
    public static function activeStatuses(): array
    {
        return [self::AWAITING_MEDIATOR_SIGNATURE, self::AWAITING_ADOPTER_SIGNATURE];
    }

    public function isActive(): bool
    {
        return in_array($this, self::activeStatuses(), true);
    }

    /**
     * German label for the admin-facing status readout.
     */
    public function label(): string
    {
        return match ($this) {
            self::AWAITING_MEDIATOR_SIGNATURE => 'Wartet auf Unterschrift des Vermittlers',
            self::AWAITING_ADOPTER_SIGNATURE => 'Wartet auf Unterschrift des Adoptanten',
            self::COMPLETED => 'Abgeschlossen',
            self::CANCELLED => 'Abgebrochen',
            self::EXPIRED => 'Abgelaufen',
        };
    }
}
