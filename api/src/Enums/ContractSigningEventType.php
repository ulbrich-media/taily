<?php

namespace Taily\Enums;

enum ContractSigningEventType: string
{
    case PROCESS_STARTED = 'process_started';
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
            self::PROCESS_STARTED => 'Vorgang gestartet',
            self::EMAIL_SENT => 'E-Mail versendet',
            self::LINK_OPENED => 'Link geöffnet',
            self::SIGNATURE_SUBMITTED => 'Unterschrift übermittelt',
            self::FINALIZED => 'Vorgang abgeschlossen',
            self::CANCELLED => 'Vorgang abgebrochen',
            self::EXPIRED => 'Link abgelaufen',
        };
    }

    /**
     * Whose name and email the trail shows for this event.
     *
     * Starting and cancelling are things an administrator does to the
     * process, so those rows name the administrator — who need not be the
     * mediator, any signed-in user can start one. The invite, the opened
     * link and the signature are all about the signer they concern. The
     * closing events are about the process and name nobody.
     */
    public function subject(): ContractSigningEventParty
    {
        return match ($this) {
            self::PROCESS_STARTED, self::CANCELLED => ContractSigningEventParty::ACTOR,
            self::EMAIL_SENT, self::LINK_OPENED, self::SIGNATURE_SUBMITTED => ContractSigningEventParty::SIGNER,
            self::FINALIZED, self::EXPIRED => ContractSigningEventParty::SYSTEM,
        };
    }

    /**
     * Whose browser the event came from, which is what the trail's IP and
     * browser columns describe.
     *
     * For every event but one this is the same party as subject(). The
     * exception is the invite email: the row is about the signer it was
     * sent to, but no signer was at a keyboard — the send is the system's,
     * triggered from an administrator's session. Printing that session's IP
     * against the recipient's name would read as the recipient having done
     * something, so those columns stay empty and the header the mail was
     * actually sent from stays in the log.
     */
    public function origin(): ContractSigningEventParty
    {
        return match ($this) {
            self::PROCESS_STARTED, self::CANCELLED => ContractSigningEventParty::ACTOR,
            self::LINK_OPENED, self::SIGNATURE_SUBMITTED => ContractSigningEventParty::SIGNER,
            self::EMAIL_SENT, self::FINALIZED, self::EXPIRED => ContractSigningEventParty::SYSTEM,
        };
    }
}
