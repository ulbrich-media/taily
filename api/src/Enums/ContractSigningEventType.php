<?php

namespace Taily\Enums;

enum ContractSigningEventType: string
{
    case LINK_GENERATED = 'link_generated';
    case EMAIL_SENT = 'email_sent';
    case LINK_OPENED = 'link_opened';
    case SIGNATURE_SUBMITTED = 'signature_submitted';
    case FINALIZED = 'finalized';
    case CANCELLED = 'cancelled';
    case EXPIRED = 'expired';

    /**
     * German label for the audit-trail appendix in the final PDF.
     */
    public function label(): string
    {
        return match ($this) {
            self::LINK_GENERATED => 'Link erstellt',
            self::EMAIL_SENT => 'E-Mail versendet',
            self::LINK_OPENED => 'Link geöffnet',
            self::SIGNATURE_SUBMITTED => 'Unterschrift übermittelt',
            self::FINALIZED => 'Vorgang abgeschlossen',
            self::CANCELLED => 'Vorgang abgebrochen',
            self::EXPIRED => 'Link abgelaufen',
        };
    }
}
