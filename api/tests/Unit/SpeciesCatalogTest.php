<?php

namespace Taily\Tests\Unit;

use Database\Seeders\Support\SpeciesCatalog;
use Faker\Factory as Faker;
use Faker\Generator;
use PHPUnit\Framework\TestCase;

class SpeciesCatalogTest extends TestCase
{
    private Generator $faker;

    protected function setUp(): void
    {
        parent::setUp();

        $this->faker = Faker::create('de_DE');
    }

    /**
     * A shelter rehomes mixes far more often than pedigrees, so the seeded
     * records should read that way too.
     */
    public function test_most_dogs_come_out_as_some_kind_of_mix(): void
    {
        $breeds = $this->draw('dogs', 2000);

        $mixed = count(array_filter($breeds, fn (string $breed) => str_contains($breed, 'Mischling')));

        $this->assertGreaterThan(0.6 * count($breeds), $mixed, 'expected mixes to dominate');
        $this->assertLessThan(0.9 * count($breeds), $mixed, 'expected pedigrees to still show up');
    }

    public function test_plain_mischling_is_the_single_most_common_dog_breed(): void
    {
        $counts = array_count_values($this->draw('dogs', 2000));

        arsort($counts);

        $this->assertSame('Mischling', array_key_first($counts));
    }

    /**
     * The cat equivalent of a mix is the domestic shorthair, not the word
     * "Mischling".
     */
    public function test_cats_are_mostly_domestic_shorthairs(): void
    {
        $counts = array_count_values($this->draw('cats', 2000));

        arsort($counts);

        $this->assertSame('Europäisch Kurzhaar', array_key_first($counts));
    }

    public function test_a_mix_is_named_after_the_breed_it_leans_on(): void
    {
        $breeds = array_unique($this->draw('dogs', 2000));

        $this->assertContains('Schäferhund-Mischling', $breeds);
        $this->assertNotContains('', $breeds);
    }

    public function test_every_species_carries_what_the_seeders_read_from_it(): void
    {
        $required = [
            'title', 'number_prefix', 'vaccinations', 'medical_tests', 'names',
            'breeds', 'weight_grams', 'size_cm', 'adoption_fee', 'boarding_cost',
            'sponsorship', 'compatibilities', 'compatibility_count',
            'personality_traits', 'personality_trait_count', 'image_directory',
        ];

        foreach (SpeciesCatalog::all() as $key => $species) {
            foreach ($required as $entry) {
                $this->assertArrayHasKey($entry, $species, "species [{$key}] is missing [{$entry}]");
            }

            $this->assertNotEmpty($species['names'], "species [{$key}] has no names");
            $this->assertSame(
                array_unique($species['names']),
                $species['names'],
                "species [{$key}] lists the same name twice"
            );

            foreach (['vaccinations', 'medical_tests'] as $entry) {
                $this->assertNotEmpty($species[$entry], "species [{$key}] has no {$entry}");

                foreach ($species[$entry] as $record) {
                    $this->assertArrayHasKey('title', $record);
                    $this->assertArrayHasKey('description', $record);
                }
            }
        }
    }

    /**
     * @return list<string>
     */
    private function draw(string $species, int $times): array
    {
        $breeds = SpeciesCatalog::all()[$species]['breeds'];

        $drawn = [];

        for ($i = 0; $i < $times; $i++) {
            $drawn[] = SpeciesCatalog::pickBreed($breeds, $this->faker);
        }

        return $drawn;
    }
}
