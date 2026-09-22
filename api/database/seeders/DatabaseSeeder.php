<?php

namespace Database\Seeders;

use Database\Seeders\Support\SeedMail;
use Database\Seeders\Support\SeedProfile;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Taily\Enums\UserRole;
use Taily\Models\User;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * How much of what gets seeded comes from the active profile — see
     * config/seeder.php and `php artisan app:seed --list`.
     *
     * Order matters: animal types come first because people are assigned roles
     * per animal type, and adoptions need both before they can pick a
     * qualified mediator and inspector.
     */
    public function run(): void
    {
        $profile = app()->bound(SeedProfile::class)
            ? app(SeedProfile::class)
            : SeedProfile::resolve();

        // One instance for the whole run, so derived addresses stay unique
        // across people and organizations.
        app()->singleton(SeedMail::class, fn () => new SeedMail(config('seeder.mail_domain', SeedMail::DOMAIN)));

        $this->command?->info("Seeding profile [{$profile->name}] — {$profile->label()}");

        $password = Hash::make(config('seeder.password', 'Test!234'));

        // The two login accounts keep fixed addresses so the documented
        // development credentials survive a reseed.
        User::factory()->create([
            'name' => 'Jane Doe',
            'email' => 'admin@local.local',
            'password' => $password,
            'role' => UserRole::ADMIN,
        ]);

        User::factory()->create([
            'name' => 'John Smith',
            'email' => 'user@local.local',
            'password' => $password,
            'role' => UserRole::USER,
        ]);

        $media = $profile->counts('media');

        // Seeders are invoked through the container, so the parameters have
        // to be named rather than positional.
        $this->call(AnimalTypeSeeder::class);

        $this->call(OrganizationSeeder::class, false, [
            'count' => $profile->int('organizations'),
        ]);

        $this->call(PersonSeeder::class, false, [
            'count' => $profile->int('people'),
            'imageLimit' => $media['people'] ?? null,
        ]);

        $this->call(AnimalSeeder::class, false, [
            'counts' => $profile->counts('animals'),
            'imageLimit' => $this->animalMedia($profile, $media['animals'] ?? null),
        ]);

        $this->call(AdoptionSeeder::class, false, [
            'count' => $profile->int('adoptions'),
            'stageWeights' => $profile->counts('adoption_stages'),
            'transportCapacity' => $profile->range('adoptions_per_transport', [2, 5]),
        ]);

        $this->call(TransportSeeder::class, false, [
            'count' => $profile->int('empty_transports'),
        ]);

        $this->call(PreInspectionSeeder::class, false, [
            'count' => $profile->int('standalone_pre_inspections'),
        ]);

        $this->call(FormTemplateSeeder::class);
    }

    /**
     * Spreads the picture budget over the species, proportional to how many
     * animals of each there are.
     *
     * @return array<string, int>
     */
    private function animalMedia(SeedProfile $profile, ?int $budget): array
    {
        $counts = $profile->counts('animals');
        $total = array_sum($counts);

        if ($budget === null || $total < 1) {
            return [];
        }

        return array_map(
            fn (int $count) => (int) round($budget * $count / $total),
            $counts
        );
    }
}
