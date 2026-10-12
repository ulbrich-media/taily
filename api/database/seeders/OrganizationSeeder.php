<?php

namespace Database\Seeders;

use Database\Seeders\Support\SeedMail;
use Faker\Factory as Faker;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Taily\Models\Organization;

/**
 * External clubs and partners a person can be affiliated with.
 *
 * Names are built from a kind and a city so any number of organizations can be
 * generated; the mail address is derived from the resulting name and lands on
 * a domain that cannot receive mail.
 */
class OrganizationSeeder extends Seeder
{
    use WithoutModelEvents;

    private const KINDS = [
        'Tierschutzverein',
        'Hundefreunde',
        'Tierrettung',
        'Pfotenhilfe',
        'Katzenhilfe',
        'Tierheim',
        'Streunerhilfe',
        'Vierbeinerhilfe',
    ];

    private const CITIES = [
        'München', 'Berlin', 'Hamburg', 'Köln', 'Leipzig', 'Frankfurt',
        'Stuttgart', 'Dresden', 'Bremen', 'Hannover', 'Nürnberg', 'Essen',
    ];

    public function run(int $count = 3): void
    {
        $faker = Faker::create('de_DE');
        $mail = app(SeedMail::class);

        foreach (self::names($count) as [$name, $city]) {
            Organization::create([
                'name' => $name,
                'email' => $mail->forOrganization($name),
                'street_line' => $faker->streetAddress(),
                'postal_code' => $faker->postcode(),
                'city' => $city,
                'country_code' => 'DE',
                'phone' => $faker->boolean(70) ? $faker->phoneNumber() : '',
                'mobile' => $faker->boolean(50) ? $faker->phoneNumber() : '',
            ]);
        }
    }

    /**
     * Distinct "<kind> <city>" names. Kind and city advance together, so even
     * a handful of organizations already look varied; the combinations repeat
     * after lcm(kinds, cities) entries and then take a numeric suffix.
     *
     * @return list<array{string, string}> name and the city it sits in
     */
    private static function names(int $count): array
    {
        $kinds = count(self::KINDS);
        $cities = count(self::CITIES);
        $period = self::leastCommonMultiple($kinds, $cities);

        $names = [];

        for ($i = 0; $i < $count; $i++) {
            $city = self::CITIES[$i % $cities];
            $name = self::KINDS[$i % $kinds].' '.$city;
            $round = intdiv($i, $period);

            $names[] = [$round === 0 ? $name : $name.' '.($round + 1), $city];
        }

        return $names;
    }

    private static function leastCommonMultiple(int $a, int $b): int
    {
        $greatestCommonDivisor = $a;
        $remainder = $b;

        while ($remainder !== 0) {
            [$greatestCommonDivisor, $remainder] = [$remainder, $greatestCommonDivisor % $remainder];
        }

        return intdiv($a, $greatestCommonDivisor) * $b;
    }
}
