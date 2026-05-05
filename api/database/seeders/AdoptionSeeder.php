<?php

namespace Database\Seeders;

use Faker\Factory as Faker;
use Illuminate\Database\Seeder;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\Person;

class AdoptionSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create('de_DE');

        $animals = Animal::all();
        $mediators = Person::whereHas('mediatorAnimalTypes')->get();
        $applicants = Person::all();

        if ($animals->isEmpty() || $applicants->isEmpty()) {
            return;
        }

        $adoptions = [
            // --- Pending (application received, mediator hasn't acted yet) ---
            [
                'status' => 'pending',
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'application_notes' => '',
                'pre_inspection_notes' => '',
                'contract_sent_at' => null,
                'contract_signed' => false,
                'contract_signed_at' => null,
                'handed_over_at' => null,
            ],
            [
                'status' => 'pending',
                'mediator_id' => null,
                'application_notes' => '',
                'pre_inspection_notes' => '',
                'contract_sent_at' => null,
                'contract_signed' => false,
                'contract_signed_at' => null,
                'handed_over_at' => null,
            ],
            [
                'status' => 'pending',
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'application_notes' => $faker->sentence(8),
                'pre_inspection_notes' => '',
                'contract_sent_at' => null,
                'contract_signed' => false,
                'contract_signed_at' => null,
                'handed_over_at' => null,
            ],

            // --- In progress: pre-inspection underway ---
            [
                'status' => 'in_progress',
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'application_notes' => $faker->sentence(8),
                'pre_inspection_notes' => '',
                'contract_sent_at' => null,
                'contract_signed' => false,
                'contract_signed_at' => null,
                'handed_over_at' => null,
            ],
            [
                'status' => 'in_progress',
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'application_notes' => $faker->sentence(8),
                'pre_inspection_notes' => '',
                'contract_sent_at' => null,
                'contract_signed' => false,
                'contract_signed_at' => null,
                'handed_over_at' => null,
            ],

            // --- In progress: pre-inspection done, contract not yet sent ---
            [
                'status' => 'in_progress',
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'application_notes' => $faker->sentence(8),
                'pre_inspection_notes' => $faker->paragraph(2),
                'contract_sent_at' => null,
                'contract_signed' => false,
                'contract_signed_at' => null,
                'handed_over_at' => null,
            ],
            [
                'status' => 'in_progress',
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'application_notes' => $faker->sentence(8),
                'pre_inspection_notes' => $faker->paragraph(2),
                'contract_sent_at' => null,
                'contract_signed' => false,
                'contract_signed_at' => null,
                'handed_over_at' => null,
            ],

            // --- In progress: contract sent, not yet signed ---
            [
                'status' => 'in_progress',
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'application_notes' => $faker->sentence(8),
                'pre_inspection_notes' => $faker->paragraph(2),
                'contract_sent_at' => $faker->dateTimeBetween('-6 weeks', '-1 week'),
                'contract_signed' => false,
                'contract_signed_at' => null,
                'handed_over_at' => null,
            ],
            [
                'status' => 'in_progress',
                'mediator_id' => null,
                'application_notes' => $faker->sentence(8),
                'pre_inspection_notes' => $faker->paragraph(2),
                'contract_sent_at' => $faker->dateTimeBetween('-6 weeks', '-1 week'),
                'contract_signed' => false,
                'contract_signed_at' => null,
                'handed_over_at' => null,
            ],

            // --- In progress: contract signed, awaiting transport ---
            [
                'status' => 'in_progress',
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'application_notes' => $faker->sentence(8),
                'pre_inspection_notes' => $faker->paragraph(2),
                'contract_sent_at' => $faker->dateTimeBetween('-2 months', '-3 weeks'),
                'contract_signed' => true,
                'contract_signed_at' => $faker->dateTimeBetween('-3 weeks', '-1 week'),
                'handed_over_at' => null,
            ],
            [
                'status' => 'in_progress',
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'application_notes' => $faker->sentence(8),
                'pre_inspection_notes' => $faker->paragraph(2),
                'contract_sent_at' => $faker->dateTimeBetween('-2 months', '-3 weeks'),
                'contract_signed' => true,
                'contract_signed_at' => $faker->dateTimeBetween('-3 weeks', '-1 week'),
                'handed_over_at' => null,
            ],

            // --- Canceled ---
            [
                'status' => 'canceled',
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'application_notes' => $faker->sentence(8),
                'pre_inspection_notes' => $faker->paragraph(2),
                'canceled_at' => $faker->dateTimeBetween('-3 months', '-1 week'),
                'canceled_reason' => $faker->sentence(10),
                'contract_sent_at' => null,
                'contract_signed' => false,
                'contract_signed_at' => null,
                'handed_over_at' => null,
            ],
            [
                'status' => 'canceled',
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'application_notes' => $faker->sentence(8),
                'pre_inspection_notes' => '',
                'canceled_at' => $faker->dateTimeBetween('-3 months', '-1 week'),
                'canceled_reason' => $faker->sentence(10),
                'contract_sent_at' => null,
                'contract_signed' => false,
                'contract_signed_at' => null,
                'handed_over_at' => null,
            ],

            // --- Done (handed over) ---
            [
                'status' => 'done',
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'application_notes' => $faker->sentence(8),
                'pre_inspection_notes' => $faker->paragraph(2),
                'contract_sent_at' => $faker->dateTimeBetween('-4 months', '-2 months'),
                'contract_signed' => true,
                'contract_signed_at' => $faker->dateTimeBetween('-2 months', '-6 weeks'),
                'handed_over_at' => $faker->dateTimeBetween('-3 weeks', '-1 week'),
            ],
            [
                'status' => 'done',
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'application_notes' => $faker->sentence(8),
                'pre_inspection_notes' => $faker->paragraph(2),
                'contract_sent_at' => $faker->dateTimeBetween('-4 months', '-2 months'),
                'contract_signed' => true,
                'contract_signed_at' => $faker->dateTimeBetween('-2 months', '-6 weeks'),
                'handed_over_at' => $faker->dateTimeBetween('-3 weeks', '-1 week'),
            ],
            [
                'status' => 'done',
                'mediator_id' => null,
                'application_notes' => $faker->sentence(8),
                'pre_inspection_notes' => $faker->paragraph(2),
                'contract_sent_at' => $faker->dateTimeBetween('-4 months', '-2 months'),
                'contract_signed' => true,
                'contract_signed_at' => $faker->dateTimeBetween('-2 months', '-6 weeks'),
                'handed_over_at' => $faker->dateTimeBetween('-3 weeks', '-1 week'),
            ],
            [
                'status' => 'done',
                'mediator_id' => $mediators->isNotEmpty() ? $mediators->random()->id : null,
                'application_notes' => $faker->sentence(8),
                'pre_inspection_notes' => $faker->paragraph(2),
                'contract_sent_at' => $faker->dateTimeBetween('-4 months', '-2 months'),
                'contract_signed' => true,
                'contract_signed_at' => $faker->dateTimeBetween('-2 months', '-6 weeks'),
                'handed_over_at' => $faker->dateTimeBetween('-3 weeks', '-1 week'),
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
