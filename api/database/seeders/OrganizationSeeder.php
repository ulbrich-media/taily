<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Taily\Models\Organization;

class OrganizationSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Organization::create([
            'name' => 'Tierschutzverein München',
            'email' => 'info@tierschutz-muenchen.de',
            'street_line' => 'Musterstraße 123',
            'postal_code' => '80331',
            'city' => 'München',
            'country_code' => 'DE',
            'phone' => '+49 89 12345678',
        ]);

        Organization::create([
            'name' => 'Hundefreunde Berlin',
            'email' => 'kontakt@hundefreunde-berlin.de',
            'street_line' => 'Berliner Allee 456',
            'postal_code' => '10115',
            'city' => 'Berlin',
            'country_code' => 'DE',
            'mobile' => '+49 30 98765432',
        ]);

        Organization::create([
            'name' => 'Tierrettung Hamburg',
            'email' => 'hilfe@tierrettung-hh.de',
            'street_line' => 'Hafenstraße 789',
            'postal_code' => '20095',
            'city' => 'Hamburg',
            'country_code' => 'DE',
            'phone' => '+49 40 55566677',
        ]);
    }
}
