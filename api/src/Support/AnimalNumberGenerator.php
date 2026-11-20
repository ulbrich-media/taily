<?php

namespace Taily\Support;

use Taily\Models\Animal;

/**
 * Generates the readable, user-facing animal number: six characters from an
 * alphabet without look-alikes (no 0/O, 1/I/L), always with at least one
 * letter so it never reads as a plain number. Uniqueness is guaranteed by the
 * unique index on `animals.animal_number`; this only avoids obvious clashes.
 */
class AnimalNumberGenerator
{
    public const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

    public const LENGTH = 6;

    /** Allowed characters of any animal number, generated or supplied. */
    public const PATTERN = '/^[A-Za-z0-9_-]{1,64}$/';

    public function generate(): string
    {
        do {
            $number = $this->candidate();
        } while (Animal::where('animal_number', $number)->exists());

        return $number;
    }

    private function candidate(): string
    {
        $max = strlen(self::ALPHABET) - 1;

        do {
            $number = '';

            for ($i = 0; $i < self::LENGTH; $i++) {
                $number .= self::ALPHABET[random_int(0, $max)];
            }
        } while (! preg_match('/[A-Z]/', $number));

        return $number;
    }
}
