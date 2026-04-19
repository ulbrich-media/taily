<?php

namespace Database\Seeders;

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
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $password = Hash::make(config('seeder.password', 'Test!234'));

        // Create admin user
        User::factory()->create([
            'name' => 'Jane Doe',
            'email' => 'admin@local.local',
            'password' => $password,
            'role' => UserRole::ADMIN,
        ]);

        // Create regular user
        User::factory()->create([
            'name' => 'John Smith',
            'email' => 'user@local.local',
            'password' => $password,
            'role' => UserRole::USER,
        ]);

        $this->call([
            OrganizationSeeder::class,
            PersonSeeder::class,
            AnimalSeeder::class,
            AdoptionSeeder::class,
            PreInspectionSeeder::class,
            FormTemplateSeeder::class,
        ]);
    }
}
