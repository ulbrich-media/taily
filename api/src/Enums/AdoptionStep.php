<?php

namespace Taily\Enums;

/**
 * The fixed steps of an adoption (docs/features/adoption.md#steps). Owned by
 * code, never configured. Their order is only used for data requirements: a
 * field required for one step stays required for every later step.
 */
enum AdoptionStep: string
{
    case APPLICATION = 'application';
    case PRE_INSPECTION = 'pre_inspection';
    case CONTRACT = 'contract';
    case TRANSPORT = 'transport';
    case HANDOVER = 'handover';

    public function position(): int
    {
        return match ($this) {
            self::APPLICATION => 0,
            self::PRE_INSPECTION => 1,
            self::CONTRACT => 2,
            self::TRANSPORT => 3,
            self::HANDOVER => 4,
        };
    }

    public function isAtOrBefore(self $other): bool
    {
        return $this->position() <= $other->position();
    }

    /**
     * The earlier of two steps; null stands for "not required".
     */
    public static function earliest(?self $a, ?self $b): ?self
    {
        if ($a === null) {
            return $b;
        }

        if ($b === null) {
            return $a;
        }

        return $a->isAtOrBefore($b) ? $a : $b;
    }

    public function label(): string
    {
        return match ($this) {
            self::APPLICATION => 'Bewerbung',
            self::PRE_INSPECTION => 'Vorkontrolle',
            self::CONTRACT => 'Vertrag',
            self::TRANSPORT => 'Transport',
            self::HANDOVER => 'Übergabe',
        };
    }
}
