<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Faker\Factory as Faker;
use Illuminate\Database\Seeder;
use Taily\Models\Adoption;
use Taily\Models\Person;
use Taily\Models\PreInspection;

class PreInspectionSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create('de_DE');

        $adoptions = Adoption::with('animal.animalType')
            ->whereIn('status', ['in_progress', 'done', 'canceled'])
            ->get();

        $inspectors = Person::whereHas('inspectorAnimalTypes')->get();

        foreach ($adoptions as $adoption) {
            $animalTypeId = $adoption->animal?->animal_type_id;

            if (! $animalTypeId) {
                continue;
            }

            // Only seed a pre-inspection when notes were set (indicates mediator used that step)
            if (empty($adoption->pre_inspection_notes)) {
                continue;
            }

            $isDone = $adoption->status === 'done';
            $verdict = $isDone ? 'approved' : ($adoption->status === 'canceled' ? 'rejected' : 'pending');
            $submittedAt = $verdict !== 'pending' ? $faker->dateTimeBetween('-8 weeks', '-1 week') : null;

            $inspector = $inspectors->isNotEmpty() ? $inspectors->random() : null;

            $inspection = PreInspection::create([
                'person_id' => $adoption->applicant_id,
                'animal_type_id' => $animalTypeId,
                'inspector_id' => $inspector?->id,
                'verdict' => $verdict,
                'notes' => $submittedAt ? $faker->paragraph(2) : '',
                'submitted_at' => $submittedAt,
            ]);

            if ($verdict === 'pending') {
                $inspection->issueToken(Carbon::now()->addDays(30));
            }
        }
    }
}
