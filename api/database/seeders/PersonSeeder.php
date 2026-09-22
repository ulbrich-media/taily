<?php

namespace Database\Seeders;

use Database\Seeders\Support\SeedImages;
use Database\Seeders\Support\SeedMail;
use Database\Seeders\Support\SeedRandom;
use Faker\Factory as Faker;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Taily\Models\AnimalType;
use Taily\Models\Organization;
use Taily\Models\Person;

/**
 * The people directory: applicants plus the members who carry the mediator,
 * inspector and foster roles.
 *
 * Roles are assigned per animal type, which AnimalTypeSeeder has already
 * created — an adoption needs an inspector qualified for the animal's type.
 */
class PersonSeeder extends Seeder
{
    private const MINIMUM_PEOPLE_PER_ROLE = 2;

    private const ADDRESS_ADDITIONS = [
        'Hinterhaus',
        'c/o Schmidt',
        '2. Stock',
        'Apartment 4B',
        '',
    ];

    public function run(int $count = 30, ?int $imageLimit = null): void
    {
        $faker = Faker::create('de_DE');
        $mail = app(SeedMail::class);
        $images = new SeedImages('people', $imageLimit);

        $organizations = Organization::all();
        $animalTypes = AnimalType::all();

        for ($i = 0; $i < $count; $i++) {
            $firstName = $faker->firstName();
            $lastName = $faker->lastName();

            $hasOrganization = $faker->boolean(40) && $organizations->isNotEmpty();
            $hasAddress = $faker->boolean(70);

            $person = Person::create([
                'first_name' => $firstName,
                'last_name' => $lastName,
                'organization_id' => $hasOrganization ? SeedRandom::pick($organizations)->id : null,
                'email' => $faker->boolean(80) ? $mail->forPerson($firstName, $lastName) : '',
                'street_line' => $hasAddress ? $faker->streetAddress() : '',
                'street_line_additional' => $hasAddress && $faker->boolean(30) ? $faker->randomElement(self::ADDRESS_ADDITIONS) : '',
                'postal_code' => $hasAddress ? $faker->postcode() : '',
                'city' => $hasAddress ? $faker->city() : '',
                'country_code' => $hasAddress ? $faker->randomElement(['DE', 'AT', 'CH']) : '',
                'phone' => $faker->boolean(50) ? $faker->phoneNumber() : '',
                'mobile' => $faker->boolean(70) ? $faker->phoneNumber() : '',
                'date_of_birth' => $faker->boolean(60) ? $faker->dateTimeBetween('-70 years', '-18 years') : null,
            ]);

            $images->attachTo($person);

            if ($animalTypes->isEmpty()) {
                continue;
            }

            // A person can hold several roles, each for a subset of the animal types.
            $roles = [
                'inspectorAnimalTypes' => 20,
                'mediatorAnimalTypes' => 25,
                'fosterAnimalTypes' => 30,
            ];

            foreach ($roles as $relation => $chance) {
                if (! $faker->boolean($chance)) {
                    continue;
                }

                $person->{$relation}()->sync(
                    SeedRandom::pickMany($animalTypes, $faker->numberBetween(1, $animalTypes->count()))->pluck('id')
                );
            }
        }

        $this->ensureEveryRoleIsCovered($animalTypes);

        // WithoutModelEvents on DatabaseSeeder suppresses the HasUuid creating event,
        // so UUIDs are not auto-generated for media created in seeders. Fix them here.
        Media::whereNull('uuid')->each(fn ($m) => $m->update(['uuid' => (string) Str::uuid()]));
    }

    /**
     * Roles are handed out by chance, which on a small data set can leave an
     * animal type without anyone to inspect or mediate for it — and then every
     * adoption of that type ends up with an inspection nobody carried out.
     * Fill those gaps.
     *
     * Two people, not one: nobody inspects their own home, so a type whose
     * only inspector is the applicant would leave the inspection unassigned
     * all the same.
     *
     * @param  Collection<int, AnimalType>  $animalTypes
     */
    private function ensureEveryRoleIsCovered(Collection $animalTypes): void
    {
        $relations = ['inspectorAnimalTypes', 'mediatorAnimalTypes', 'fosterAnimalTypes'];

        foreach ($animalTypes as $animalType) {
            foreach ($relations as $relation) {
                $holds = fn ($query) => $query->where('animal_types.id', $animalType->id);

                $missing = self::MINIMUM_PEOPLE_PER_ROLE - Person::whereHas($relation, $holds)->count();

                if ($missing < 1) {
                    continue;
                }

                $candidates = SeedRandom::shuffle(
                    Person::whereDoesntHave($relation, $holds)->get()
                )->take($missing);

                foreach ($candidates as $person) {
                    $person->{$relation}()->syncWithoutDetaching([$animalType->id]);
                }
            }
        }
    }
}
