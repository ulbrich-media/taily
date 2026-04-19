<?php

namespace Database\Seeders;

use Faker\Factory as Faker;
use Illuminate\Database\Seeder;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\Person;

class AdoptionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create('de_DE');

        $animals = Animal::all();
        $mediators = Person::whereHas('mediatorAnimalTypes')->get();
        $applicants = Person::all();
        $inspectors = Person::whereHas('inspectorAnimalTypes')->get();

        if ($animals->isEmpty() || $applicants->isEmpty()) {
            return;
        }

        $adoptions = [
            // --- Not started (no inspector, no result) ---
            [
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'inspector_id' => null,
                'pre_inspection_result' => 'not_conducted',
                'pre_inspection_summary' => '',
                'contract_sent_at' => null,
                'contract_signed' => false,
                'transfer_planned_at' => null,
                'transferred_at' => null,
            ],
            [
                'mediator_id' => null, // no mediator
                'inspector_id' => null,
                'pre_inspection_result' => 'not_conducted',
                'pre_inspection_summary' => '',
                'contract_sent_at' => null,
                'contract_signed' => false,
                'transfer_planned_at' => null,
                'transferred_at' => null,
            ],
            [
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'inspector_id' => null,
                'pre_inspection_result' => 'not_conducted',
                'pre_inspection_summary' => '',
                'contract_sent_at' => null,
                'contract_signed' => false,
                'transfer_planned_at' => null,
                'transferred_at' => null,
            ],

            // --- Pre-inspection in progress (inspector assigned, not yet decided) ---
            [
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'inspector_id' => $inspectors->isNotEmpty() ? $inspectors->random()->id : null,
                'pre_inspection_result' => 'not_conducted',
                'pre_inspection_summary' => '',
                'contract_sent_at' => null,
                'contract_signed' => false,
                'transfer_planned_at' => null,
                'transferred_at' => null,
            ],
            [
                'mediator_id' => null, // no mediator
                'inspector_id' => $inspectors->isNotEmpty() ? $inspectors->random()->id : null,
                'pre_inspection_result' => 'not_conducted',
                'pre_inspection_summary' => '',
                'contract_sent_at' => null,
                'contract_signed' => false,
                'transfer_planned_at' => null,
                'transferred_at' => null,
            ],
            [
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'inspector_id' => $inspectors->isNotEmpty() ? $inspectors->random()->id : null,
                'pre_inspection_result' => 'not_conducted',
                'pre_inspection_summary' => '',
                'contract_sent_at' => null,
                'contract_signed' => false,
                'transfer_planned_at' => null,
                'transferred_at' => null,
            ],

            // --- Pre-inspection rejected (overall: rejected) ---
            [
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'inspector_id' => $inspectors->isNotEmpty() ? $inspectors->random()->id : null,
                'pre_inspection_result' => 'rejected',
                'pre_inspection_summary' => $faker->paragraph(2),
                'contract_sent_at' => null,
                'contract_signed' => false,
                'transfer_planned_at' => null,
                'transferred_at' => null,
            ],
            [
                'mediator_id' => null, // no mediator
                'inspector_id' => $inspectors->isNotEmpty() ? $inspectors->random()->id : null,
                'pre_inspection_result' => 'rejected',
                'pre_inspection_summary' => $faker->paragraph(2),
                'contract_sent_at' => null,
                'contract_signed' => false,
                'transfer_planned_at' => null,
                'transferred_at' => null,
            ],

            // --- Pre-inspection approved, contract not yet started ---
            [
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'inspector_id' => $inspectors->isNotEmpty() ? $inspectors->random()->id : null,
                'pre_inspection_result' => 'approved',
                'pre_inspection_summary' => $faker->paragraph(2),
                'contract_sent_at' => null,
                'contract_signed' => false,
                'transfer_planned_at' => null,
                'transferred_at' => null,
            ],
            [
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'inspector_id' => $inspectors->isNotEmpty() ? $inspectors->random()->id : null,
                'pre_inspection_result' => 'approved',
                'pre_inspection_summary' => $faker->paragraph(2),
                'contract_sent_at' => null,
                'contract_signed' => false,
                'transfer_planned_at' => null,
                'transferred_at' => null,
            ],

            // --- Contract in progress (sent, not signed) ---
            [
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'inspector_id' => $inspectors->isNotEmpty() ? $inspectors->random()->id : null,
                'pre_inspection_result' => 'approved',
                'pre_inspection_summary' => $faker->paragraph(2),
                'contract_sent_at' => $faker->dateTimeBetween('-6 weeks', '-1 week'),
                'contract_signed' => false,
                'transfer_planned_at' => null,
                'transferred_at' => null,
            ],
            [
                'mediator_id' => null, // no mediator
                'inspector_id' => $inspectors->isNotEmpty() ? $inspectors->random()->id : null,
                'pre_inspection_result' => 'approved',
                'pre_inspection_summary' => $faker->paragraph(2),
                'contract_sent_at' => $faker->dateTimeBetween('-6 weeks', '-1 week'),
                'contract_signed' => false,
                'transfer_planned_at' => null,
                'transferred_at' => null,
            ],

            // --- Contract signed, transfer not yet planned ---
            [
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'inspector_id' => $inspectors->isNotEmpty() ? $inspectors->random()->id : null,
                'pre_inspection_result' => 'approved',
                'pre_inspection_summary' => $faker->paragraph(2),
                'contract_sent_at' => $faker->dateTimeBetween('-2 months', '-3 weeks'),
                'contract_signed' => true,
                'transfer_planned_at' => null,
                'transferred_at' => null,
            ],
            [
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'inspector_id' => $inspectors->isNotEmpty() ? $inspectors->random()->id : null,
                'pre_inspection_result' => 'approved',
                'pre_inspection_summary' => $faker->paragraph(2),
                'contract_sent_at' => $faker->dateTimeBetween('-2 months', '-3 weeks'),
                'contract_signed' => true,
                'transfer_planned_at' => null,
                'transferred_at' => null,
            ],

            // --- Transfer in progress (planned, not yet done) ---
            [
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'inspector_id' => $inspectors->isNotEmpty() ? $inspectors->random()->id : null,
                'pre_inspection_result' => 'approved',
                'pre_inspection_summary' => $faker->paragraph(2),
                'contract_sent_at' => $faker->dateTimeBetween('-3 months', '-6 weeks'),
                'contract_signed' => true,
                'transfer_planned_at' => $faker->dateTimeBetween('-1 week', '+2 weeks'),
                'transferred_at' => null,
            ],
            [
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'inspector_id' => $inspectors->isNotEmpty() ? $inspectors->random()->id : null,
                'pre_inspection_result' => 'approved',
                'pre_inspection_summary' => $faker->paragraph(2),
                'contract_sent_at' => $faker->dateTimeBetween('-3 months', '-6 weeks'),
                'contract_signed' => true,
                'transfer_planned_at' => $faker->dateTimeBetween('-1 week', '+2 weeks'),
                'transferred_at' => null,
            ],

            // --- Completed (transferred) ---
            [
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'inspector_id' => $inspectors->isNotEmpty() ? $inspectors->random()->id : null,
                'pre_inspection_result' => 'approved',
                'pre_inspection_summary' => $faker->paragraph(2),
                'contract_sent_at' => $faker->dateTimeBetween('-4 months', '-2 months'),
                'contract_signed' => true,
                'transfer_planned_at' => $faker->dateTimeBetween('-6 weeks', '-3 weeks'),
                'transferred_at' => $faker->dateTimeBetween('-3 weeks', '-1 week'),
            ],
            [
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'inspector_id' => $inspectors->isNotEmpty() ? $inspectors->random()->id : null,
                'pre_inspection_result' => 'approved',
                'pre_inspection_summary' => $faker->paragraph(2),
                'contract_sent_at' => $faker->dateTimeBetween('-4 months', '-2 months'),
                'contract_signed' => true,
                'transfer_planned_at' => $faker->dateTimeBetween('-6 weeks', '-3 weeks'),
                'transferred_at' => $faker->dateTimeBetween('-3 weeks', '-1 week'),
            ],
            [
                'mediator_id' => null, // no mediator
                'inspector_id' => $inspectors->isNotEmpty() ? $inspectors->random()->id : null,
                'pre_inspection_result' => 'approved',
                'pre_inspection_summary' => $faker->paragraph(2),
                'contract_sent_at' => $faker->dateTimeBetween('-4 months', '-2 months'),
                'contract_signed' => true,
                'transfer_planned_at' => $faker->dateTimeBetween('-6 weeks', '-3 weeks'),
                'transferred_at' => $faker->dateTimeBetween('-3 weeks', '-1 week'),
            ],
            [
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'inspector_id' => $inspectors->isNotEmpty() ? $inspectors->random()->id : null,
                'pre_inspection_result' => 'approved',
                'pre_inspection_summary' => $faker->paragraph(2),
                'contract_sent_at' => $faker->dateTimeBetween('-4 months', '-2 months'),
                'contract_signed' => true,
                'transfer_planned_at' => $faker->dateTimeBetween('-6 weeks', '-3 weeks'),
                'transferred_at' => $faker->dateTimeBetween('-3 weeks', '-1 week'),
            ],
        ];

        foreach ($adoptions as $data) {
            Adoption::create(array_merge($data, [
                'animal_id' => $animals->random()->id,
                'applicant_id' => $applicants->random()->id,
            ]));
        }
    }
}
