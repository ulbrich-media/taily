<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Taily\Models\FormTemplate;

class FormTemplateSeeder extends Seeder
{
    public function run(): void
    {
        FormTemplate::create([
            'type' => 'inspection',
            'name' => 'Veterinär Inspektion',
            'version' => 1,
            'schema' => [
                '$schema' => 'http://json-schema.org/draft-07/schema#',
                'title' => 'Veterinär Inspektion',
                'type' => 'object',
                'required' => ['health_status', 'weight'],
                'properties' => [
                    'health_status' => [
                        'type' => 'string',
                        'enum' => ['healthy', 'ill', 'recovering', 'critical'],
                    ],
                    'weight' => [
                        'type' => 'number',
                        'minimum' => 0,
                        'maximum' => 200,
                    ],
                    'temperature' => [
                        'type' => 'number',
                        'minimum' => 35,
                        'maximum' => 42,
                    ],
                    'notes' => [
                        'type' => 'string',
                    ],
                    'follow_up_required' => [
                        'type' => 'boolean',
                    ],
                ],
                'additionalProperties' => false,
            ],
            'ui_schema' => [
                'ui:order' => ['health_status', 'weight', 'temperature', 'notes', 'follow_up_required'],
                'health_status' => [
                    'ui:title' => 'Gesundheitsstatus',
                    'ui:options' => [
                        'labels' => [
                            ['value' => 'healthy', 'label' => 'Gesund'],
                            ['value' => 'ill', 'label' => 'Krank'],
                            ['value' => 'recovering', 'label' => 'In Genesung'],
                            ['value' => 'critical', 'label' => 'Kritisch'],
                        ],
                    ],
                ],
                'weight' => [
                    'ui:title' => 'Gewicht (kg)',
                ],
                'temperature' => [
                    'ui:title' => 'Körpertemperatur (°C)',
                ],
                'notes' => [
                    'ui:title' => 'Anmerkungen',
                ],
                'follow_up_required' => [
                    'ui:title' => 'Nachkontrolle erforderlich',
                ],
            ],
        ]);

        // V2: removes `temperature`, adds `parasite_status`
        FormTemplate::create([
            'type' => 'inspection',
            'name' => 'Veterinär Inspektion',
            'version' => 2,
            'schema' => [
                '$schema' => 'http://json-schema.org/draft-07/schema#',
                'title' => 'Veterinär Inspektion',
                'type' => 'object',
                'required' => ['health_status', 'weight'],
                'properties' => [
                    'health_status' => [
                        'type' => 'string',
                        'enum' => ['healthy', 'ill', 'recovering', 'critical'],
                    ],
                    'weight' => [
                        'type' => 'number',
                        'minimum' => 0,
                        'maximum' => 200,
                    ],
                    'parasite_status' => [
                        'type' => 'string',
                        'enum' => ['untreated', 'treated', 'not_applicable'],
                    ],
                    'notes' => [
                        'type' => 'string',
                    ],
                    'follow_up_required' => [
                        'type' => 'boolean',
                    ],
                ],
                'additionalProperties' => false,
            ],
            'ui_schema' => [
                'ui:order' => ['health_status', 'weight', 'parasite_status', 'notes', 'follow_up_required'],
                'health_status' => [
                    'ui:title' => 'Gesundheitsstatus',
                    'ui:options' => [
                        'labels' => [
                            ['value' => 'healthy', 'label' => 'Gesund'],
                            ['value' => 'ill', 'label' => 'Krank'],
                            ['value' => 'recovering', 'label' => 'In Genesung'],
                            ['value' => 'critical', 'label' => 'Kritisch'],
                        ],
                    ],
                ],
                'weight' => [
                    'ui:title' => 'Gewicht (kg)',
                ],
                'parasite_status' => [
                    'ui:title' => 'Parasitenbehandlung',
                    'ui:options' => [
                        'labels' => [
                            ['value' => 'untreated', 'label' => 'Unbehandelt'],
                            ['value' => 'treated', 'label' => 'Behandelt'],
                            ['value' => 'not_applicable', 'label' => 'Nicht zutreffend'],
                        ],
                    ],
                ],
                'notes' => [
                    'ui:title' => 'Anmerkungen',
                ],
                'follow_up_required' => [
                    'ui:title' => 'Nachkontrolle erforderlich',
                ],
            ],
        ]);

        FormTemplate::create([
            'type' => 'application',
            'name' => 'Adoptionsbewerbung',
            'version' => 1,
            'schema' => [
                '$schema' => 'http://json-schema.org/draft-07/schema#',
                'title' => 'Adoptionsbewerbung',
                'type' => 'object',
                'required' => ['living_situation', 'has_garden', 'previous_pets'],
                'properties' => [
                    'living_situation' => [
                        'type' => 'string',
                        'enum' => ['house', 'apartment', 'farm', 'other'],
                    ],
                    'has_garden' => [
                        'type' => 'boolean',
                    ],
                    'garden_size_sqm' => [
                        'type' => 'integer',
                        'minimum' => 0,
                    ],
                    'previous_pets' => [
                        'type' => 'string',
                        'enum' => ['none', 'dogs', 'cats', 'other', 'multiple'],
                    ],
                    'adults_in_household' => [
                        'type' => 'integer',
                        'minimum' => 1,
                    ],
                    'children_in_household' => [
                        'type' => 'integer',
                        'minimum' => 0,
                    ],
                    'hours_alone_per_day' => [
                        'type' => 'number',
                        'minimum' => 0,
                        'maximum' => 24,
                    ],
                    'motivation' => [
                        'type' => 'string',
                    ],
                ],
                'additionalProperties' => false,
            ],
            'ui_schema' => [
                'ui:order' => [
                    'living_situation', 'has_garden', 'garden_size_sqm',
                    'previous_pets', 'adults_in_household', 'children_in_household',
                    'hours_alone_per_day', 'motivation',
                ],
                'living_situation' => [
                    'ui:title' => 'Wohnsituation',
                    'ui:options' => [
                        'labels' => [
                            ['value' => 'house', 'label' => 'Haus'],
                            ['value' => 'apartment', 'label' => 'Wohnung'],
                            ['value' => 'farm', 'label' => 'Bauernhof'],
                            ['value' => 'other', 'label' => 'Sonstiges'],
                        ],
                    ],
                ],
                'has_garden' => [
                    'ui:title' => 'Garten vorhanden',
                ],
                'garden_size_sqm' => [
                    'ui:title' => 'Gartengröße (m²)',
                ],
                'previous_pets' => [
                    'ui:title' => 'Frühere Haustiererfahrung',
                    'ui:options' => [
                        'labels' => [
                            ['value' => 'none', 'label' => 'Keine'],
                            ['value' => 'dogs', 'label' => 'Hunde'],
                            ['value' => 'cats', 'label' => 'Katzen'],
                            ['value' => 'other', 'label' => 'Andere'],
                            ['value' => 'multiple', 'label' => 'Mehrere Tierarten'],
                        ],
                    ],
                ],
                'adults_in_household' => [
                    'ui:title' => 'Erwachsene im Haushalt',
                ],
                'children_in_household' => [
                    'ui:title' => 'Kinder im Haushalt',
                ],
                'hours_alone_per_day' => [
                    'ui:title' => 'Stunden allein pro Tag',
                ],
                'motivation' => [
                    'ui:title' => 'Motivation zur Adoption',
                ],
            ],
        ]);
    }
}
