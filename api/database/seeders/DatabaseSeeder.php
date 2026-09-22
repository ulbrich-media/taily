<?php

namespace Database\Seeders;

use Database\Seeders\Support\SeedMail;
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
     * Order matters: animal types come first because people are assigned roles
     * per animal type, and adoptions need both before they can pick a
     * qualified mediator and inspector.
     */
    public function run(): void
    {
        // One instance for the whole run, so derived addresses stay unique
        // across people and organizations.
        app()->singleton(SeedMail::class, fn () => new SeedMail);

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

        $this->call([
            AnimalTypeSeeder::class,
            OrganizationSeeder::class,
            PersonSeeder::class,
            AnimalSeeder::class,
            AdoptionSeeder::class,
            TransportSeeder::class,
            PreInspectionSeeder::class,
            FormTemplateSeeder::class,
        ]);
    }
}
