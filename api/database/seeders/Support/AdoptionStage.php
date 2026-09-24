<?php

namespace Database\Seeders\Support;

/**
 * A point an adoption can have reached in the process described in
 * docs/features/adoption.md.
 *
 * The seeder picks a stage and derives every field from it, so an adoption is
 * always internally consistent: a transport is never assigned to an adoption
 * whose contract is unsigned, a handover never happens without a transport.
 */
enum AdoptionStage: string
{
    /** Application received, mediator has not started working on it. */
    case Applied = 'applied';

    /** Pre-inspection triggered, inspector has not submitted it yet. */
    case InReview = 'in_review';

    /** Pre-inspection came back approved, no contract yet. */
    case Inspected = 'inspected';

    /** Contract signed, animal not yet scheduled for transport. */
    case ContractSigned = 'contract_signed';

    /** Assigned to a transport run that has not happened yet. */
    case TransportPlanned = 'transport_planned';

    /** Transport arrived, adopter has not received the animal yet. */
    case TransportDone = 'transport_done';

    /** Animal handed over, adoption complete. */
    case HandedOver = 'handed_over';

    /** Stopped along the way, after a rejected pre-inspection. */
    case Canceled = 'canceled';

    public function adoptionStatus(): string
    {
        return match ($this) {
            self::Applied => 'pending',
            self::Canceled => 'canceled',
            self::HandedOver => 'done',
            default => 'in_progress',
        };
    }

    public function hasPreInspection(): bool
    {
        return $this !== self::Applied;
    }

    /**
     * The verdict the inspector recorded, or null while the inspection is
     * still out with them.
     */
    public function preInspectionVerdict(): ?string
    {
        return match ($this) {
            self::Applied, self::InReview => null,
            self::Canceled => 'rejected',
            default => 'approved',
        };
    }

    public function hasContract(): bool
    {
        return in_array($this, [
            self::ContractSigned,
            self::TransportPlanned,
            self::TransportDone,
            self::HandedOver,
        ], true);
    }

    /**
     * Which kind of transport run this adoption belongs on, if any.
     */
    public function transport(): TransportState
    {
        return match ($this) {
            self::TransportPlanned => TransportState::Open,
            self::TransportDone, self::HandedOver => TransportState::Done,
            default => TransportState::None,
        };
    }

    public function isHandedOver(): bool
    {
        return $this === self::HandedOver;
    }

    /**
     * Whether the adoption still occupies the animal, which is what the
     * animal list shows as "reserviert".
     */
    public function reservesAnimal(): bool
    {
        return $this->adoptionStatus() === 'in_progress';
    }
}
