<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Faker\Factory as Faker;
use Illuminate\Database\Seeder;
use Taily\Models\Adoption;
use Taily\Models\PreInspection;

class PreInspectionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create('de_DE');

        $adoptions = Adoption::with('animal.animalType')->get();

        foreach ($adoptions as $adoption) {
            $animalTypeId = $adoption->animal?->animal_type_id;

            if (! $animalTypeId) {
                continue;
            }

            // Only create a pre-inspection if an inspector is assigned or result is known
            $hasInspector = $adoption->inspector_id !== null;
            $isSubmitted = in_array($adoption->pre_inspection_result, ['approved', 'rejected']);

            if (! $hasInspector && ! $isSubmitted) {
                continue;
            }

            $verdict = match ($adoption->pre_inspection_result) {
                'approved' => 'approved',
                'rejected' => 'rejected',
                default => 'pending',
            };

            $submittedAt = $isSubmitted
                ? $faker->dateTimeBetween('-8 weeks', '-1 week')
                : null;

            $notes = $isSubmitted ? $faker->paragraph(2) : '';

            $inspection = PreInspection::create([
                'person_id' => $adoption->applicant_id,
                'animal_type_id' => $animalTypeId,
                'inspector_id' => $adoption->inspector_id,
                'verdict' => $verdict,
                'notes' => $notes,
                'submitted_at' => $submittedAt,
            ]);

            // Issue a valid token for pending (in-progress) inspections so the link works
            if ($verdict === 'pending') {
                $inspection->issueToken(Carbon::now()->addDays(30));
            }
        }
    }
}
