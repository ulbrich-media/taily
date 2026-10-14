<?php

namespace Database\Seeders;

use Database\Seeders\Support\SeedImages;
use Database\Seeders\Support\SeedMail;
use Database\Seeders\Support\SeedRandom;
use Faker\Factory as Faker;
use Faker\Generator;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use InvalidArgumentException;
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

    /**
     * @param  int  $imageShare  percentage of people who get a profile picture
     * @param  int|null  $mediators  exactly how many people carry the mediator
     *                               role; null leaves it to chance per
     *                               person. Every animal type gets at least
     *                               two of them, so the number must allow
     *                               that, and cannot exceed the people
     */
    public function run(int $count = 30, int $imageShare = 100, ?int $mediators = null): void
    {
        $faker = Faker::create('de_DE');
        $mail = app(SeedMail::class);
        $images = new SeedImages('people', $imageShare);

        $organizations = Organization::all();
        $animalTypes = AnimalType::all();

        $this->assertMediatorCount($mediators, $count, $animalTypes);

        /** @var list<Person> $people */
        $people = [];

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
            $people[] = $person;

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
                // A fixed number of mediators is handed out afterwards.
                if ($relation === 'mediatorAnimalTypes' && $mediators !== null) {
                    continue;
                }

                if (! $faker->boolean($chance)) {
                    continue;
                }

                $person->{$relation}()->sync(
                    SeedRandom::pickMany($animalTypes, $faker->numberBetween(1, $animalTypes->count()))->pluck('id')
                );
            }
        }

        if ($mediators !== null && $animalTypes->isNotEmpty()) {
            $this->assignMediators($people, $mediators, $animalTypes, $faker);
        }

        // A fixed set of mediators already covers every animal type (see
        // assignMediators), and topping up here would add people to it.
        $this->ensureEveryRoleIsCovered(
            $animalTypes,
            $mediators === null
                ? ['inspectorAnimalTypes', 'mediatorAnimalTypes', 'fosterAnimalTypes']
                : ['inspectorAnimalTypes', 'fosterAnimalTypes'],
        );

        // WithoutModelEvents on DatabaseSeeder suppresses the HasUuid creating event,
        // so UUIDs are not auto-generated for media created in seeders. Fix them here.
        Media::whereNull('uuid')->each(fn ($m) => $m->update(['uuid' => (string) Str::uuid()]));
    }

    /**
     * Rejects a mediator count the data set cannot honour, rather than
     * quietly seeding a different one.
     *
     * @param  Collection<int, AnimalType>  $animalTypes
     */
    private function assertMediatorCount(?int $mediators, int $people, Collection $animalTypes): void
    {
        if ($mediators === null) {
            return;
        }

        if ($mediators < 0 || $mediators > $people) {
            throw new InvalidArgumentException(
                "Cannot seed {$mediators} mediators out of {$people} people."
            );
        }

        if ($animalTypes->isNotEmpty() && $mediators < self::MINIMUM_PEOPLE_PER_ROLE) {
            throw new InvalidArgumentException(sprintf(
                'Cannot seed %d mediators: every animal type needs at least %d.',
                $mediators,
                self::MINIMUM_PEOPLE_PER_ROLE,
            ));
        }
    }

    /**
     * Gives exactly `$count` people the mediator role, each for a random
     * subset of the animal types, and makes sure that among them every
     * animal type has at least two mediators. A shelter has few mediators
     * and many adoptions, so a data set sized for load should not spread its
     * adoptions thinly over hundreds of them.
     *
     * @param  list<Person>  $people
     * @param  Collection<int, AnimalType>  $animalTypes
     */
    private function assignMediators(array $people, int $count, Collection $animalTypes, Generator $faker): void
    {
        $pool = SeedRandom::pickMany(collect($people), $count)->values();

        /** @var array<int, array<string, string>> $typesByMediator animal type ids, keyed by pool position */
        $typesByMediator = [];

        foreach ($pool as $position => $person) {
            $typesByMediator[$position] = SeedRandom::pickMany(
                $animalTypes,
                $faker->numberBetween(1, $animalTypes->count())
            )->pluck('id', 'id')->all();
        }

        // Cover the types the draw left short, from within the pool.
        foreach ($animalTypes as $animalType) {
            $without = SeedRandom::shuffle(
                $pool->keys()->reject(fn (int $position) => isset($typesByMediator[$position][$animalType->id]))
            );

            $missing = self::MINIMUM_PEOPLE_PER_ROLE - ($pool->count() - $without->count());

            foreach ($without->take(max(0, $missing)) as $position) {
                $typesByMediator[$position][$animalType->id] = $animalType->id;
            }
        }

        foreach ($pool as $position => $person) {
            $person->mediatorAnimalTypes()->sync(array_values($typesByMediator[$position]));
        }
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
     * @param  list<string>  $relations  the roles to top up
     */
    private function ensureEveryRoleIsCovered(Collection $animalTypes, array $relations): void
    {
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
