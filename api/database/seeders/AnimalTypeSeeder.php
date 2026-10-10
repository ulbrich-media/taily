<?php

namespace Database\Seeders;

use Database\Seeders\Support\SpeciesCatalog;
use Illuminate\Database\Seeder;
use Taily\Models\AnimalType;

/**
 * Reference data every other seeder depends on.
 *
 * Runs first: people are assigned inspector, mediator and foster roles per
 * animal type, so the types have to exist before PersonSeeder.
 */
class AnimalTypeSeeder extends Seeder
{
    public function run(): void
    {
        foreach (SpeciesCatalog::all() as $species) {
            $animalType = AnimalType::create(['title' => $species['title']]);

            foreach ($species['vaccinations'] as $vaccination) {
                $animalType->vaccinations()->create($vaccination);
            }

            foreach ($species['medical_tests'] as $medicalTest) {
                $animalType->medicalTests()->create($medicalTest);
            }
        }
    }
}
