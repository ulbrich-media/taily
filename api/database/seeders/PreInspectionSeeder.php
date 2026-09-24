<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Database\Seeders\Support\SeedRandom;
use Faker\Factory as Faker;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Taily\Models\Adoption;
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
        $people = Person::all();

        if ($animalTypes->isEmpty() || $people->isEmpty()) {
            return;
        }

        $taken = $this->inspectionsAlreadyHeld();
        $placed = 0;

        for ($i = 0; $i < $count; $i++) {
            $animalType = SeedRandom::pick($animalTypes);

            // An inspection belongs to a person and an animal type, so a
            // second one for the same pair would only muddy the status an
            // adoption derives from it. Other types are fair game.
            $candidates = $people->reject(
                fn (Person $candidate) => isset($taken[$candidate->id.'|'.$animalType->id])
            );

            if ($candidates->isEmpty()) {
                continue;
            }

            $person = SeedRandom::pick($candidates);
            $taken[$person->id.'|'.$animalType->id] = true;
            $placed++;

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

            $inspection->inspector_id = $this->inspectorFor($inspectors, $animalType->id, $person)?->id;
            $inspection->verdict = $isSubmitted ? $faker->randomElement(['approved', 'rejected']) : 'pending';
            $inspection->submitted_at = $submittedAt;
            $inspection->created_at = $createdAt;
            $inspection->updated_at = $submittedAt ?? $createdAt;
            $inspection->save();

            if (! $isSubmitted) {
                $inspection->issueToken(Carbon::now()->addDays(30));
            }
        }

        if ($placed < $count) {
            $this->command?->warn(
                "Only {$placed} of {$count} standalone pre-inspections could be seeded — everyone has already been inspected for the animal types on offer."
            );
        }
    }

    /**
     * Every person and animal type that already has an inspection between
     * them, whether it was seeded here or belongs to an adoption.
     *
     * @return array<string, true>
     */
    private function inspectionsAlreadyHeld(): array
    {
        $taken = [];

        foreach (PreInspection::all(['person_id', 'animal_type_id']) as $inspection) {
            $taken[$inspection->person_id.'|'.$inspection->animal_type_id] = true;
        }

        foreach (Adoption::with('animal:id,animal_type_id')->get(['applicant_id', 'animal_id']) as $adoption) {
            if ($adoption->animal !== null) {
                $taken[$adoption->applicant_id.'|'.$adoption->animal->animal_type_id] = true;
            }
        }

        return $taken;
    }

    /**
     * @param  Collection<int, Person>  $inspectors
     */
    private function inspectorFor(Collection $inspectors, string $animalTypeId, Person $subject): ?Person
    {
        // Nobody inspects their own home.
        $eligible = $inspectors->filter(
            fn (Person $person) => $person->id !== $subject->id
                && $person->inspectorAnimalTypes->contains('id', $animalTypeId)
        );

        return SeedRandom::pick($eligible);
    }
}
