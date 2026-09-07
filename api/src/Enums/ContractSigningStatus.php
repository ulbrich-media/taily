<?php

namespace Taily\Enums;

enum ContractSigningStatus: string
{
    case AWAITING_MEDIATOR_SIGNATURE = 'awaiting_mediator_signature';
    case AWAITING_ADOPTER_SIGNATURE = 'awaiting_adopter_signature';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
    case EXPIRED = 'expired';
}
