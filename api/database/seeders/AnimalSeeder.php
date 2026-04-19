<?php

namespace Database\Seeders;

use Faker\Factory as Faker;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\HealthCondition;
use Taily\Models\Person;

class AnimalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create('de_DE');

        // Load and shuffle seeder images so each is assigned at most once
        $dogImages = glob(base_path('seeder-assets/dogs/*.jpg'));
        $catImages = glob(base_path('seeder-assets/cats/*.jpg'));
        shuffle($dogImages);
        shuffle($catImages);

        // Create animal types
        $animalTypeDog = AnimalType::create([
            'title' => 'Hund',
        ]);

        $animalTypeCat = AnimalType::create([
            'title' => 'Katze',
        ]);

        $animalTypes = collect([$animalTypeDog, $animalTypeCat]);

        // Assign inspector/mediator/foster animal types to persons who don't have them yet.
        // PersonSeeder ran before animal types existed, so those assignments were all skipped.
        $persons = Person::all();
        foreach ($persons as $person) {
            if ($faker->boolean(20)) {
                $randomTypes = $animalTypes->random($faker->numberBetween(1, $animalTypes->count()));
                $person->inspectorAnimalTypes()->sync(collect($randomTypes)->pluck('id'));
            }

            if ($faker->boolean(25)) {
                $randomTypes = $animalTypes->random($faker->numberBetween(1, $animalTypes->count()));
                $person->mediatorAnimalTypes()->sync(collect($randomTypes)->pluck('id'));
            }

            if ($faker->boolean(30)) {
                $randomTypes = $animalTypes->random($faker->numberBetween(1, $animalTypes->count()));
                $person->fosterAnimalTypes()->sync(collect($randomTypes)->pluck('id'));
            }
        }

        // Create health conditions for dogs
        // These can be used as either vaccinations or tests
        $healthConditions = [
            HealthCondition::create([
                'name' => 'Tollwut',
                'animal_type_id' => $animalTypeDog->id,
            ]),
            HealthCondition::create([
                'name' => 'Borreliose',
                'animal_type_id' => $animalTypeDog->id,
            ]),
            HealthCondition::create([
                'name' => 'Leishmaniose',
                'animal_type_id' => $animalTypeDog->id,
            ]),
        ];

        $breeds = [
            'Labrador Retriever',
            'Deutscher Schäferhund',
            'Golden Retriever',
            'Beagle',
            'Dackel',
            'Border Collie',
            'Boxer',
            'Rottweiler',
            'Pudel',
            'Französische Bulldogge',
            'Mischling',
            'Jack Russell Terrier',
            'Australian Shepherd',
            'Husky',
            'Chihuahua',
        ];

        $colors = [
            'Schwarz',
            'Weiß',
            'Braun',
            'Golden',
            'Grau',
            'Schwarz-Weiß',
            'Braun-Weiß',
            'Tricolor',
            'Gestromt',
            'Rot',
            'Creme',
        ];

        $dogNames = [
            'Max', 'Bella', 'Rocky', 'Luna', 'Bruno', 'Lilly', 'Buddy', 'Maja',
            'Rex', 'Emma', 'Sam', 'Nala', 'Lucky', 'Coco', 'Balu', 'Mila',
            'Leo', 'Susi', 'Charlie', 'Greta', 'Oscar', 'Frieda', 'Paul', 'Hanna',
        ];

        $countries = [
            'Deutschland', 'Spanien', 'Griechenland', 'Rumänien', 'Bulgarien',
            'Portugal', 'Italien', 'Türkei', 'Ungarn', 'Polen',
        ];

        $locations = [
            'Berlin', 'München', 'Hamburg', 'Köln', 'Frankfurt', 'Stuttgart',
            'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig', 'Bremen', 'Dresden',
        ];

        $organizations = [
            'Tierschutzverein München e.V.',
            'Tierheim Berlin',
            'Pfotenhilfe Spanien',
            'Hundeengel Griechenland',
            'Straßenhunde Rumänien e.V.',
        ];

        // Get all persons for relations
        $persons = Person::all();

        // Create 25 demo dogs
        for ($i = 1; $i <= 25; $i++) {
            $intakeDate = $faker->dateTimeBetween('-3 years', '-1 month');
            $dateOfBirth = $faker->dateTimeBetween('-12 years', '-3 months');
            $isDeceased = $faker->boolean(5);

            $animal = Animal::create([
                // Tab 1: Basic & Description
                'animal_type_id' => $animalTypeDog->id,
                'animal_number' => 'DOG-'.str_pad($i, 5, '0', STR_PAD_LEFT),
                'name' => $faker->randomElement($dogNames),
                'old_name' => $faker->boolean(30) ? $faker->randomElement($dogNames) : '',
                'breed' => $faker->randomElement($breeds),
                'gender' => $faker->randomElement(['male', 'female']),
                'color' => $faker->randomElement($colors),
                'date_of_birth' => $dateOfBirth,
                'origin_country' => $faker->randomElement($countries),
                'is_boarding_animal' => $faker->boolean(20),
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
                'assigned_agent_id' => $faker->boolean(70) && $persons->isNotEmpty() ? $persons->random()->id : null,
                'origin_organization' => $faker->boolean(80) ? $faker->randomElement($organizations) : '',
                'owner_id' => $faker->boolean(30) && $persons->isNotEmpty() ? $persons->random()->id : null,
                'adoption_fee' => $faker->boolean(90) ? $faker->randomFloat(2, 200, 450) : null,
                'monthly_boarding_cost' => $faker->boolean(25) ? $faker->randomFloat(2, 50, 200) : null,
                'monthly_sponsorship' => $faker->boolean(20) ? $faker->randomFloat(2, 20, 100) : null,
                'sponsor_id' => $faker->boolean(15) && $persons->isNotEmpty() ? $persons->random()->id : null,
                'sponsor_external' => $faker->boolean(10) ? $faker->name() : '',
                // Tab 4: Organization, Marketing & Status
                'current_location' => $faker->randomElement($locations),
                'alternate_transport_trace' => $faker->boolean(15) ? 'ALT'.$faker->numerify('######') : '',
                'alternate_arrival_location' => $faker->boolean(10) ? $faker->randomElement($locations) : '',
                'do_publish' => $faker->boolean(85),
                'is_deceased' => $isDeceased,
                'date_of_death' => $isDeceased ? $faker->dateTimeBetween($intakeDate, 'now') : null,
            ]);

            // Assign one dog image if still available
            $image = array_shift($dogImages);
            if ($image) {
                $animal->addMedia($image)
                    ->preservingOriginal()
                    ->toMediaCollection('pictures');
            }

            // Randomly assign health conditions as vaccinations to dogs
            // Each animal gets 0-3 vaccinations
            $numVaccinations = $faker->numberBetween(0, 3);
            $selectedVaccinations = $faker->randomElements($healthConditions, $numVaccinations);

            foreach ($selectedVaccinations as $healthCondition) {
                $animal->healthConditionVaccinations()->attach($healthCondition->id, [
                    'vaccinated_at' => $faker->dateTimeBetween('-2 years', 'now'),
                ]);
            }

            // Randomly assign health conditions as tests to dogs
            // Each animal gets 0-3 tests
            // A health condition can be both a vaccination and a test for the same animal
            $numTests = $faker->numberBetween(0, 3);
            $selectedTests = $faker->randomElements($healthConditions, $numTests);

            foreach ($selectedTests as $healthCondition) {
                $animal->healthConditionTests()->attach($healthCondition->id, [
                    'tested_at' => $faker->dateTimeBetween('-2 years', 'now'),
                    'result' => $faker->randomElement(['positive', 'negative']),
                ]);
            }
        }

        // Cat-specific data
        $catBreeds = [
            'Europäisch Kurzhaar',
            'Perser',
            'Maine Coon',
            'Britisch Kurzhaar',
            'Siamkatze',
            'Norwegische Waldkatze',
            'Bengal',
            'Ragdoll',
            'Mischling',
            'Hauskatze',
        ];

        $catNames = [
            'Mia', 'Felix', 'Luna', 'Simba', 'Lilly', 'Garfield', 'Nala', 'Tiger',
            'Minnie', 'Leo', 'Lucy', 'Sammy', 'Mimi', 'Whisker', 'Kitty', 'Shadow',
        ];

        // Create 10 demo cats
        for ($i = 1; $i <= 10; $i++) {
            $intakeDate = $faker->dateTimeBetween('-3 years', '-1 month');
            $dateOfBirth = $faker->dateTimeBetween('-12 years', '-3 months');
            $isDeceased = $faker->boolean(5);

            $animal = Animal::create([
                // Tab 1: Basic & Description
                'animal_type_id' => $animalTypeCat->id,
                'animal_number' => 'CAT-'.str_pad($i, 5, '0', STR_PAD_LEFT),
                'name' => $faker->randomElement($catNames),
                'old_name' => $faker->boolean(30) ? $faker->randomElement($catNames) : '',
                'breed' => $faker->randomElement($catBreeds),
                'gender' => $faker->randomElement(['male', 'female']),
                'color' => $faker->randomElement($colors),
                'date_of_birth' => $dateOfBirth,
                'origin_country' => $faker->randomElement($countries),
                'is_boarding_animal' => $faker->boolean(20),
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
                'assigned_agent_id' => $faker->boolean(70) && $persons->isNotEmpty() ? $persons->random()->id : null,
                'origin_organization' => $faker->boolean(80) ? $faker->randomElement($organizations) : '',
                'owner_id' => $faker->boolean(30) && $persons->isNotEmpty() ? $persons->random()->id : null,
                'adoption_fee' => $faker->boolean(90) ? $faker->randomFloat(2, 150, 350) : null,
                'monthly_boarding_cost' => $faker->boolean(25) ? $faker->randomFloat(2, 40, 150) : null,
                'monthly_sponsorship' => $faker->boolean(20) ? $faker->randomFloat(2, 15, 80) : null,
                'sponsor_id' => $faker->boolean(15) && $persons->isNotEmpty() ? $persons->random()->id : null,
                'sponsor_external' => $faker->boolean(10) ? $faker->name() : '',
                // Tab 4: Organization, Marketing & Status
                'current_location' => $faker->randomElement($locations),
                'alternate_transport_trace' => $faker->boolean(15) ? 'ALT'.$faker->numerify('######') : '',
                'alternate_arrival_location' => $faker->boolean(10) ? $faker->randomElement($locations) : '',
                'do_publish' => $faker->boolean(85),
                'is_deceased' => $isDeceased,
                'date_of_death' => $isDeceased ? $faker->dateTimeBetween($intakeDate, 'now') : null,
            ]);

            // Assign one cat image if still available
            $image = array_shift($catImages);
            if ($image) {
                $animal->addMedia($image)
                    ->preservingOriginal()
                    ->toMediaCollection('pictures');
            }
        }

        // WithoutModelEvents on DatabaseSeeder suppresses the HasUuid creating event,
        // so UUIDs are not auto-generated for media created in seeders. Fix them here.
        Media::whereNull('uuid')->each(fn ($m) => $m->update(['uuid' => (string) Str::uuid()]));
    }
}
