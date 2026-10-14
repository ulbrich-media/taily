<?php

namespace Taily\Tests\Feature;

use Database\Seeders\AnimalTypeSeeder;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\PersonSeeder;
use Database\Seeders\Support\SeedMail;
use Database\Seeders\Support\SeedProfile;
use Database\Seeders\Support\SeedRandom;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use Taily\Models\Adoption;
use Taily\Models\AnimalType;
use Taily\Models\Person;
use Taily\Tests\TestCase;

/**
 * A shelter has few mediators and many adoptions. A profile that names the
 * number of mediators must get exactly that many, and the adoptions must pile
 * up on them instead of being spread thinly over everybody.
 */
class SeederMediatorLoadTest extends TestCase
{
    use RefreshDatabase;

    #[DataProvider('impossibleMediatorCounts')]
    public function test_a_mediator_count_the_data_cannot_honour_is_rejected(int $mediators): void
    {
        $this->seed(AnimalTypeSeeder::class);
        $this->app->singleton(SeedMail::class, fn () => new SeedMail('local.local'));

        $this->expectException(InvalidArgumentException::class);

        // Rejected before anything is created: 60 people cannot have 61
        // mediators, and every animal type needs two.
        $this->app->make(PersonSeeder::class)->run(60, 0, $mediators);
    }

    /**
     * @return array<string, array{int}>
     */
    public static function impossibleMediatorCounts(): array
    {
        return [
            'more than people' => [61],
            'fewer than a type needs' => [1],
            'negative' => [-1],
        ];
    }

    public function test_a_fixed_number_of_mediators_carry_the_adoptions(): void
    {
        $profile = SeedProfile::resolve('dev', [
            'media.people' => 0,
            'media.animals' => 0,
            'people' => 60,
            'mediators' => 3,
            'adoptions' => 90,
            'animals.dogs' => 90,
            'animals.cats' => 40,
        ]);

        $this->app->instance(SeedProfile::class, $profile);
        $this->app->forgetInstance(SeedMail::class);

        SeedRandom::seed(20260413);

        $this->seed(DatabaseSeeder::class);

        $mediators = Person::whereHas('mediatorAnimalTypes')->pluck('id');

        // Exactly the requested number, and every animal type still has the
        // two it needs among them.
        $this->assertCount(3, $mediators);

        foreach (AnimalType::all() as $animalType) {
            $this->assertGreaterThanOrEqual(
                2,
                Person::whereHas('mediatorAnimalTypes', fn ($q) => $q->where('animal_types.id', $animalType->id))->count()
            );
        }

        $assigned = Adoption::whereNotNull('mediator_id')->count();

        $this->assertSame(
            $assigned,
            Adoption::whereIn('mediator_id', $mediators)->count(),
            'Every assigned adoption belongs to a mediator.'
        );

        // Few mediators: the busiest one handles a real share of the work.
        $busiest = Adoption::whereNotNull('mediator_id')
            ->selectRaw('mediator_id, count(*) as total')
            ->groupBy('mediator_id')
            ->orderByDesc('total')
            ->value('total');

        $this->assertGreaterThanOrEqual(15, $busiest);
    }
}
