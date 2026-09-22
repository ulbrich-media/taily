<?php

namespace Database\Seeders;

use Database\Seeders\Support\SeedImages;
use Database\Seeders\Support\SeedRandom;
use Database\Seeders\Support\SpeciesCatalog;
use Faker\Factory as Faker;
use Faker\Generator;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\MedicalTest;
use Taily\Models\Person;
use Taily\Models\Vaccination;
use Taily\Services\AnimalTraitService;

/**
 * The animals, generated per species from SpeciesCatalog.
 *
 * Placement state that belongs to an adoption — whether the animal is reserved
 * and who owns it — is deliberately left alone here; AdoptionSeeder sets it
 * from the adoptions it creates, so the two can never contradict each other.
 */
class AnimalSeeder extends Seeder
{
    /**
     * @param  array<string, int>  $counts  how many animals per species key
     * @param  array<string, int>|int|null  $imageLimit  how many animals get a picture
     */
    public function run(array $counts = ['dogs' => 25, 'cats' => 10], array|int|null $imageLimit = null): void
    {
        $faker = Faker::create('de_DE');
        $persons = Person::all();

        foreach (SpeciesCatalog::all() as $key => $species) {
            $count = $counts[$key] ?? 0;

            if ($count < 1) {
                continue;
            }

            $animalType = AnimalType::where('title', $species['title'])->first();

            if (! $animalType) {
                continue;
            }

            $images = new SeedImages(
                $species['image_directory'],
                is_array($imageLimit) ? ($imageLimit[$key] ?? null) : $imageLimit,
            );

            $vaccinations = $animalType->vaccinations()->get();
            $medicalTests = $animalType->medicalTests()->get();

            for ($i = 1; $i <= $count; $i++) {
                $animal = $this->createAnimal($faker, $species, $animalType->id, $i, $persons);

                $images->attachTo($animal);

                $this->attachHealthRecords($faker, $animal, $vaccinations, $medicalTests);
                $this->attachTraits($faker, $animal, $species);
            }
        }

        // WithoutModelEvents on DatabaseSeeder suppresses the HasUuid creating event,
        // so UUIDs are not auto-generated for media created in seeders. Fix them here.
        Media::whereNull('uuid')->each(fn ($m) => $m->update(['uuid' => (string) Str::uuid()]));
    }

    /**
     * @param  array<string, mixed>  $species
     * @param  Collection<int, Person>  $persons
     */
    private function createAnimal(Generator $faker, array $species, string $animalTypeId, int $index, $persons): Animal
    {
        $intakeDate = $faker->dateTimeBetween('-3 years', '-1 month');
        $isDeceased = $faker->boolean(5);
        $isBoardingAnimal = $faker->boolean(20);

        return Animal::create([
            // Tab 1: Basic & Description
            'animal_type_id' => $animalTypeId,
            'animal_number' => $species['number_prefix'].'-'.str_pad((string) $index, 5, '0', STR_PAD_LEFT),
            'name' => $faker->randomElement($species['names']),
            'old_name' => $faker->boolean(30) ? $faker->randomElement($species['names']) : '',
            'breed' => SpeciesCatalog::pickBreed($species['breeds'], $faker),
            'gender' => $faker->randomElement(['male', 'female']),
            'color' => $faker->randomElement(SpeciesCatalog::colors()),
            'weight_grams' => $faker->boolean(75) ? $faker->numberBetween(...$species['weight_grams']) : null,
            'size_cm' => $faker->boolean(75) ? $faker->numberBetween(...$species['size_cm']) : null,
            'date_of_birth' => $faker->dateTimeBetween('-12 years', '-3 months'),
            'origin_country' => $faker->randomElement(SpeciesCatalog::originCountries()),
            'is_boarding_animal' => $isBoardingAnimal,
            'intake_date' => $intakeDate,
            'character_description' => $faker->boolean(70) ? $faker->realText(200) : '',
            'contract_notes' => $faker->boolean(30) ? $faker->realText(150) : '',
            'internal_notes' => $faker->boolean(40) ? $faker->realText(100) : '',
            // Tab 2: Health & Identification
            'is_neutered' => $faker->boolean(65),
            'health_description' => $faker->boolean(50) ? $faker->realText(150) : '',
            'tasso_id' => $faker->boolean(60) ? 'DE'.$faker->numerify('##########') : '',
            'findefix_id' => $faker->boolean(40) ? $faker->numerify('###.###.###') : '',
            'trace_id' => $faker->boolean(50) ? 'TR'.$faker->numerify('########') : '',
            // Tab 3: Placement, Contract & Costs
            'assigned_agent_id' => $faker->boolean(70) && $persons->isNotEmpty() ? SeedRandom::pick($persons)->id : null,
            'origin_organization' => $faker->boolean(80) ? $faker->randomElement(SpeciesCatalog::originOrganizations()) : '',
            // A boarding animal is housed on behalf of someone who already owns it;
            // an adoptable animal only gets an owner once it has been handed over.
            'owner_id' => $isBoardingAnimal && $persons->isNotEmpty() ? SeedRandom::pick($persons)->id : null,
            'adoption_fee' => $faker->boolean(90) ? $faker->randomFloat(2, ...$species['adoption_fee']) : null,
            'monthly_boarding_cost' => $isBoardingAnimal ? $faker->randomFloat(2, ...$species['boarding_cost']) : null,
            'monthly_sponsorship' => $faker->boolean(20) ? $faker->randomFloat(2, ...$species['sponsorship']) : null,
            'sponsor_id' => $faker->boolean(15) && $persons->isNotEmpty() ? SeedRandom::pick($persons)->id : null,
            'sponsor_external' => $faker->boolean(10) ? $faker->name() : '',
            // Tab 4: Organization, Marketing & Status
            'current_location' => $faker->randomElement(SpeciesCatalog::locations()),
            'alternate_transport_trace' => $faker->boolean(15) ? 'ALT'.$faker->numerify('######') : '',
            'alternate_arrival_location' => $faker->boolean(10) ? $faker->randomElement(SpeciesCatalog::locations()) : '',
            'do_publish' => $faker->boolean(85),
            'publish_description' => $faker->boolean(60) ? $faker->realText(300) : '',
            'application_url' => $faker->boolean(50) ? $faker->url() : '',
            'is_deceased' => $isDeceased,
            'date_of_death' => $isDeceased ? $faker->dateTimeBetween($intakeDate, 'now') : null,
        ]);
    }

    /**
     * @param  Collection<int, Vaccination>  $vaccinations
     * @param  Collection<int, MedicalTest>  $medicalTests
     */
    private function attachHealthRecords(Generator $faker, Animal $animal, $vaccinations, $medicalTests): void
    {
        foreach (SeedRandom::pickMany($vaccinations, $faker->numberBetween(0, $vaccinations->count())) as $vaccination) {
            $animal->vaccinations()->attach($vaccination->id, [
                'vaccinated_at' => $faker->dateTimeBetween($animal->intake_date ?? '-2 years', 'now'),
            ]);
        }

        foreach (SeedRandom::pickMany($medicalTests, $faker->numberBetween(0, $medicalTests->count())) as $medicalTest) {
            $animal->medicalTests()->attach($medicalTest->id, [
                'tested_at' => $faker->dateTimeBetween($animal->intake_date ?? '-2 years', 'now'),
                // Most tests come back clear; a positive is the exception.
                'result' => $faker->boolean(85) ? 'negative' : 'positive',
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $species
     */
    private function attachTraits(Generator $faker, Animal $animal, array $species): void
    {
        if ($faker->boolean(80)) {
            AnimalTraitService::sync($animal, 'compatibility', $faker->randomElements(
                $species['compatibilities'],
                $faker->numberBetween(...$species['compatibility_count'])
            ));
        }

        if ($faker->boolean(85)) {
            AnimalTraitService::sync($animal, 'personality_trait', $faker->randomElements(
                $species['personality_traits'],
                $faker->numberBetween(...$species['personality_trait_count'])
            ));
        }
    }
}
