<?php

namespace Taily\Enums;

/**
 * Who an audit event is about, and whose device it came from.
 *
 * Every row of the printed Prüfprotokoll describes exactly one party. Most
 * events describe the same party twice over — the adopter opens their own
 * link from their own browser — but not all of them: an invite email names
 * the signer it went to while being sent by the system, on an authenticated
 * user's command. Keeping the two questions apart is what stops a row from
 * pairing one person's name with another person's IP address.
 *
 * SYSTEM is the absence of a party rather than a party of its own: as a
 * subject it means the event belongs to the process itself, and as an
 * origin it means no browser was involved.
 */
enum ContractSigningEventParty
{
    case SIGNER;
    case ACTOR;
    case SYSTEM;
}
