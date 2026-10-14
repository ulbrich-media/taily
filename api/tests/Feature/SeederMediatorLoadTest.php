<?php

namespace Taily\Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Database\Seeders\Support\SeedMail;
use Database\Seeders\Support\SeedProfile;
use Database\Seeders\Support\SeedRandom;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Taily\Models\Adoption;
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

        // Covering every animal type may add a person, never more than the
        // types there are.
        $this->assertGreaterThanOrEqual(3, $mediators->count());
        $this->assertLessThanOrEqual(3 + 2 * 2, $mediators->count());

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
