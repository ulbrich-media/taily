<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Faker\Factory as Faker;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Taily\Models\AnimalType;
use Taily\Models\Person;
use Taily\Models\PreInspection;

/**
 * Standalone pre-inspections — ones that exist for a person without an
 * adoption behind them. A pre-inspection can be triggered for a person at any
 * time, so the inspection list is not only fed by running adoptions.
 *
 * Inspections belonging to an adoption are created by AdoptionSeeder, which
 * owns their place in that adoption's timeline.
 */
class PreInspectionSeeder extends Seeder
{
    public function run(int $count = 4): void
    {
        if ($count < 1) {
            return;
        }

        $faker = Faker::create('de_DE');

        $animalTypes = AnimalType::all();
        $inspectors = Person::with('inspectorAnimalTypes')->whereHas('inspectorAnimalTypes')->get();

        // People with an adoption already carry the inspection that adoption
        // needs — a second one for the same type would only muddy the status
        // the adoption derives from it.
        $people = Person::whereDoesntHave('adoptionsAsApplicant')->get();

        if ($animalTypes->isEmpty() || $people->isEmpty()) {
            return;
        }

        for ($i = 0; $i < $count; $i++) {
            $animalType = $animalTypes->random();
            $person = $people->random();

            // Two thirds are still out with the inspector, so the list shows
            // both open and finished work.
            $isSubmitted = $faker->boolean(35);
            $createdAt = Carbon::instance($faker->dateTimeBetween('-6 months', '-1 week'));
            $submittedAt = $isSubmitted
                ? Carbon::instance($faker->dateTimeBetween($createdAt, 'now'))
                : null;

            $inspection = new PreInspection([
                'person_id' => $person->id,
                'animal_type_id' => $animalType->id,
                'notes' => $isSubmitted ? $faker->paragraph(2) : '',
            ]);

            $inspection->inspector_id = $this->inspectorFor($inspectors, $animalType->id)?->id;
            $inspection->verdict = $isSubmitted ? $faker->randomElement(['approved', 'rejected']) : 'pending';
            $inspection->submitted_at = $submittedAt;
            $inspection->created_at = $createdAt;
            $inspection->updated_at = $submittedAt ?? $createdAt;
            $inspection->save();

            if (! $isSubmitted) {
                $inspection->issueToken(Carbon::now()->addDays(30));
            }
        }
    }

    /**
     * @param  Collection<int, Person>  $inspectors
     */
    private function inspectorFor(Collection $inspectors, string $animalTypeId): ?Person
    {
        $eligible = $inspectors->filter(
            fn (Person $person) => $person->inspectorAnimalTypes->contains('id', $animalTypeId)
        );

        return $eligible->isNotEmpty() ? $eligible->random() : null;
    }
}
