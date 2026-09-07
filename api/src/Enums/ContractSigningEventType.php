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
}
