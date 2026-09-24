<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Taily\Models\Animal;
use Taily\Models\Person;
use Taily\Models\User;
use Taily\Tests\TestCase;

/**
 * The command itself, rather than the seeders behind it — the options decide
 * what a developer actually gets, and getting one of them wrong is silent.
 */
class SeedDatabaseCommandTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Smallest profile, no pictures: these tests are about the options, and
     * attaching media runs the image conversions inline.
     *
     * @param  array<string, mixed>  $extra
     * @return array<string, mixed>
     */
    private function seedOptions(array $extra = []): array
    {
        return array_merge([
            '--profile' => 'minimal',
            '--set' => ['media.people=0', 'media.animals=0'],
        ], $extra);
    }

    public function test_it_seeds_the_chosen_profile(): void
    {
        $this->artisan('app:seed', $this->seedOptions())->assertSuccessful();

        $this->assertSame(2, User::count());
        $this->assertGreaterThan(0, Animal::count());
    }

    /**
     * "0" is a perfectly good seed and a falsy string, so a truthiness check
     * would quietly leave the run unpinned.
     */
    public function test_a_seed_of_zero_still_pins_the_run(): void
    {
        $this->artisan('app:seed', $this->seedOptions(['--seed' => '0']))->assertSuccessful();

        // The counter-based keys only exist while a run is pinned.
        $this->assertStringStartsWith('00000000-', (string) Person::orderBy('id')->value('id'));
    }

    public function test_a_seed_that_is_not_a_number_is_refused(): void
    {
        $this->artisan('app:seed', $this->seedOptions(['--seed' => 'banana']))->assertFailed();

        $this->assertSame(0, User::count());
    }

    /**
     * The seeder always creates the same two login accounts, so a second run
     * would fail halfway through on a duplicate address.
     */
    public function test_it_refuses_to_seed_over_an_existing_data_set(): void
    {
        $this->artisan('app:seed', $this->seedOptions())->assertSuccessful();

        $this->artisan('app:seed', $this->seedOptions())->assertFailed();

        $this->assertSame(2, User::count());
    }

    public function test_an_unknown_profile_is_refused_before_anything_is_written(): void
    {
        $this->artisan('app:seed', ['--profile' => 'does-not-exist'])->assertFailed();

        $this->assertSame(0, User::count());
    }

    public function test_it_lists_the_profiles_without_touching_the_database(): void
    {
        $this->artisan('app:seed', ['--list' => true])->assertSuccessful();

        $this->assertSame(0, User::count());
    }

    public function test_an_override_reaches_the_seeders(): void
    {
        $this->artisan('app:seed', $this->seedOptions(['--set' => [
            'media.people=0',
            'media.animals=0',
            'animals.dogs=3',
            'animals.cats=2',
        ]]))->assertSuccessful();

        $this->assertSame(5, Animal::count());
    }
}
