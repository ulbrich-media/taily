<?php

namespace Database\Seeders\Support;

use Illuminate\Support\Str;

/**
 * Derives mail addresses from the name they belong to, so seeded people and
 * organizations carry an address a human can match to the record at a glance.
 *
 * Everything lands on a domain that cannot receive mail, so a stray send from a
 * development environment never reaches a real inbox.
 */
class SeedMail
{
    public const DOMAIN = 'local.local';

    /** @var array<string, true> */
    private array $issued = [];

    public function __construct(private readonly string $domain = self::DOMAIN) {}

    /**
     * lena.mueller@local.local
     */
    public function forPerson(string $firstName, string $lastName): string
    {
        return $this->unique(self::slug($firstName).'.'.self::slug($lastName));
    }

    /**
     * tierschutzverein-muenchen@local.local
     */
    public function forOrganization(string $name): string
    {
        return $this->unique(self::slug($name));
    }

    /**
     * Turns a German name into a mail-safe local part. Str::slug() drops
     * umlauts instead of expanding them (Müller -> mller), so transliterate
     * first.
     */
    public static function slug(string $value): string
    {
        $transliterated = strtr($value, [
            'ä' => 'ae', 'ö' => 'oe', 'ü' => 'ue', 'ß' => 'ss',
            'Ä' => 'Ae', 'Ö' => 'Oe', 'Ü' => 'Ue',
        ]);

        $slug = Str::slug($transliterated);

        return $slug !== '' ? $slug : 'kontakt';
    }

    /**
     * Keeps the readable form when it is still free, and falls back to a
     * numeric suffix (john.doe1527@local.local) when it is taken.
     */
    private function unique(string $localPart): string
    {
        $candidate = $localPart;

        while (isset($this->issued[$candidate])) {
            // mt_rand, not random_int: the suffix has to come from the same
            // seeded stream as the rest, or `app:seed --seed=` would hand the
            // same person a different address on every run.
            $candidate = $localPart.mt_rand(1000, 9999);
        }

        $this->issued[$candidate] = true;

        return $candidate.'@'.$this->domain;
    }
}
