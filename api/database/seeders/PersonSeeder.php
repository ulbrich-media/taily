<?php

namespace Database\Seeders;

use Faker\Factory as Faker;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Taily\Models\AnimalType;
use Taily\Models\Organization;
use Taily\Models\Person;

class PersonSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create('de_DE');

        // Load and shuffle seeder images so each is assigned at most once
        $peopleImages = glob(base_path('seeder-assets/people/*.jpg'));
        shuffle($peopleImages);

        $organizations = Organization::all();
        $animalTypes = AnimalType::all();

        for ($i = 1; $i <= 30; $i++) {
            $hasOrganization = $faker->boolean(40);
            $organizationId = $hasOrganization && $organizations->isNotEmpty() ? $organizations->random()->id : null;

            $isInspector = $faker->boolean(20);
            $isFoster = $faker->boolean(30);
            $isMediator = $faker->boolean(25);

            $hasAddress = $faker->boolean(70);

            $additionalLines = [
                'Hinterhaus',
                'c/o Schmidt',
                '2. Stock',
                'Apartment 4B',
                '',
            ];

            $person = Person::create([
                'first_name' => $faker->firstName(),
                'last_name' => $faker->lastName(),
                'organization_id' => $organizationId,
                'email' => $faker->boolean(80) ? $faker->safeEmail() : '',
                'street_line' => $hasAddress ? $faker->streetAddress() : '',
                'street_line_additional' => $hasAddress && $faker->boolean(30) ? $faker->randomElement($additionalLines) : '',
                'postal_code' => $hasAddress ? $faker->postcode() : '',
                'city' => $hasAddress ? $faker->city() : '',
                'country_code' => $hasAddress ? $faker->randomElement(['DE', 'AT', 'CH']) : '',
                'phone' => $faker->boolean(50) ? $faker->phoneNumber() : '',
                'mobile' => $faker->boolean(70) ? $faker->phoneNumber() : '',
                'date_of_birth' => $faker->boolean(60) ? $faker->dateTimeBetween('-70 years', '-18 years') : null,
            ]);

            // Assign one person image if still available
            $image = array_shift($peopleImages);
            if ($image) {
                $person->addMedia($image)
                    ->preservingOriginal()
                    ->toMediaCollection('pictures');
            }

            // If person is inspector, assign random animal types
            if ($isInspector && $animalTypes->isNotEmpty()) {
                $randomAnimalTypes = $animalTypes->random($faker->numberBetween(1, min(3, $animalTypes->count())));
                $person->inspectorAnimalTypes()->sync($randomAnimalTypes->pluck('id'));
            }

            // If person is mediator, assign random animal types
            if ($isMediator && $animalTypes->isNotEmpty()) {
                $randomAnimalTypes = $animalTypes->random($faker->numberBetween(1, min(3, $animalTypes->count())));
                $person->mediatorAnimalTypes()->sync($randomAnimalTypes->pluck('id'));
            }

            // If person is foster, assign random animal types
            if ($isFoster && $animalTypes->isNotEmpty()) {
                $randomAnimalTypes = $animalTypes->random($faker->numberBetween(1, min(3, $animalTypes->count())));
                $person->fosterAnimalTypes()->sync($randomAnimalTypes->pluck('id'));
            }
        }

        // WithoutModelEvents on DatabaseSeeder suppresses the HasUuid creating event,
        // so UUIDs are not auto-generated for media created in seeders. Fix them here.
        Media::whereNull('uuid')->each(fn ($m) => $m->update(['uuid' => (string) Str::uuid()]));
    }
}
