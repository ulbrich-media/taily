<?php

namespace Taily\Enums;

/**
 * The species values accepted by the Tiervermittlung.de Partner-API. Animal
 * Types are free text in Taily, so each one is mapped to one of these by an
 * admin; animals of an unmapped type are not exported.
 */
enum TiervermittlungSpecies: string
{
    case DOG = 'dog';
    case CAT = 'cat';
    case SMALL = 'small';
    case BIRD = 'bird';
    case REPTILE = 'reptile';
    case HORSE = 'horse';
    case FISH = 'fish';
    case OTHER = 'other';

    /**
     * @return array<string>
     */
    public static function values(): array
    {
        return array_map(fn (self $species) => $species->value, self::cases());
    }

    /**
     * Tiervermittlung.de only knows the broad species, so the Animal Type's
     * own title is sent along as detail for the catch-all groups.
     */
    public function wantsDetail(): bool
    {
        return $this === self::SMALL || $this === self::OTHER;
    }
}
