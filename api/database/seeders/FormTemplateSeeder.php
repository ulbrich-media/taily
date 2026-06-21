<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Taily\Models\AnimalType;
use Taily\Models\FormTemplate;

class FormTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $inspectionForm = FormTemplate::create(['name' => 'Veterinär Inspektion']);

        $inspectionForm->versions()->create([
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
                'weight' => ['ui:title' => 'Gewicht (kg)'],
                'temperature' => ['ui:title' => 'Körpertemperatur (°C)'],
                'notes' => ['ui:title' => 'Anmerkungen'],
                'follow_up_required' => ['ui:title' => 'Nachkontrolle erforderlich'],
            ],
        ]);

        // V2: removes `temperature`, adds `parasite_status`
        $inspectionForm->versions()->create([
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
                'weight' => ['ui:title' => 'Gewicht (kg)'],
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
                'notes' => ['ui:title' => 'Anmerkungen'],
                'follow_up_required' => ['ui:title' => 'Nachkontrolle erforderlich'],
            ],
        ]);

        $adoptionForm = FormTemplate::create(['name' => 'Vorkontrolle Hund']);

        AnimalType::where('title', 'Hund')->update([
            'pre_inspection_form_template_id' => $adoptionForm->id,
        ]);

        $adoptionForm->versions()->create([
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
                'has_garden' => ['ui:title' => 'Garten vorhanden'],
                'garden_size_sqm' => ['ui:title' => 'Gartengröße (m²)'],
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
                'adults_in_household' => ['ui:title' => 'Erwachsene im Haushalt'],
                'children_in_household' => ['ui:title' => 'Kinder im Haushalt'],
                'hours_alone_per_day' => ['ui:title' => 'Stunden allein pro Tag'],
                'motivation' => ['ui:title' => 'Motivation zur Adoption'],
            ],
        ]);

        // ---------------------------------------------------------------
        // Showcase: one form that exercises every available field type
        // ---------------------------------------------------------------
        $showcaseForm = FormTemplate::create(['name' => 'Formular-Showcase']);

        $showcaseForm->versions()->create([
            'version' => 1,
            'schema' => [
                '$schema' => 'http://json-schema.org/draft-07/schema#',
                'title' => 'Formular-Showcase',
                'type' => 'object',
                'required' => ['full_name', 'email', 'birth_date', 'rating', 'category', 'contact_method', 'agree'],
                'properties' => [
                    // text — minLength, maxLength, description
                    'full_name' => [
                        'type' => 'string',
                        'minLength' => 2,
                        'maxLength' => 100,
                        'description' => 'Vor- und Nachname der Person.',
                    ],
                    // textarea — free-form multi-line text
                    'notes' => [
                        'type' => 'string',
                        'maxLength' => 1000,
                    ],
                    // number — minimum, maximum, multipleOf (step)
                    'rating' => [
                        'type' => 'number',
                        'minimum' => 0,
                        'maximum' => 10,
                        'multipleOf' => 0.5,
                        'description' => 'Bewertung von 0 bis 10 in 0,5-Schritten.',
                    ],
                    // integer — whole numbers only
                    'age' => [
                        'type' => 'integer',
                        'minimum' => 0,
                        'maximum' => 120,
                    ],
                    // boolean — toggle / checkbox
                    'agree' => [
                        'type' => 'boolean',
                    ],
                    // select — string enum rendered as dropdown
                    'category' => [
                        'type' => 'string',
                        'enum' => ['bronze', 'silver', 'gold', 'platinum'],
                    ],
                    // radio — string enum rendered as radio group
                    'contact_method' => [
                        'type' => 'string',
                        'enum' => ['email', 'phone', 'post'],
                    ],
                    // date — format:date with minDate / maxDate
                    'birth_date' => [
                        'type' => 'string',
                        'format' => 'date',
                    ],
                    // email — format:email
                    'email' => [
                        'type' => 'string',
                        'format' => 'email',
                    ],
                    // phone — format:phone
                    'phone_number' => [
                        'type' => 'string',
                        'format' => 'phone',
                    ],
                    // heading fields have no schema properties — see ui:order / uiSchema below
                ],
                'additionalProperties' => false,
            ],
            'ui_schema' => [
                'ui:order' => [
                    // Heading: Persönliche Daten
                    'section_personal',
                    'full_name',
                    'age',
                    'birth_date',
                    'email',
                    'phone_number',
                    // Heading: Bewertung & Kategorisierung
                    'section_rating',
                    'rating',
                    'category',
                    'contact_method',
                    // Heading: Sonstiges
                    'section_misc',
                    'notes',
                    'agree',
                ],
                // Headings (ui:widget "heading" — no schema property)
                'section_personal' => [
                    'ui:widget' => 'heading',
                    'ui:title' => 'Persönliche Daten',
                ],
                'section_rating' => [
                    'ui:widget' => 'heading',
                    'ui:title' => 'Bewertung & Kategorisierung',
                ],
                'section_misc' => [
                    'ui:widget' => 'heading',
                    'ui:title' => 'Sonstiges',
                ],
                // text
                'full_name' => [
                    'ui:title' => 'Vollständiger Name',
                    'ui:placeholder' => 'Max Mustermann',
                ],
                // textarea with rows option
                'notes' => [
                    'ui:title' => 'Anmerkungen',
                    'ui:widget' => 'textarea',
                    'ui:placeholder' => 'Beliebige Notizen …',
                    'ui:options' => [
                        'rows' => 5,
                    ],
                ],
                // number
                'rating' => [
                    'ui:title' => 'Bewertung',
                    'ui:placeholder' => '5',
                ],
                // integer
                'age' => [
                    'ui:title' => 'Alter',
                    'ui:placeholder' => '30',
                ],
                // boolean
                'agree' => [
                    'ui:title' => 'Ich stimme den Bedingungen zu',
                ],
                // select with labels
                'category' => [
                    'ui:title' => 'Kategorie',
                    'ui:options' => [
                        'labels' => [
                            ['value' => 'bronze', 'label' => 'Bronze'],
                            ['value' => 'silver', 'label' => 'Silber'],
                            ['value' => 'gold', 'label' => 'Gold'],
                            ['value' => 'platinum', 'label' => 'Platin'],
                        ],
                    ],
                ],
                // radio with labels
                'contact_method' => [
                    'ui:title' => 'Bevorzugter Kontaktweg',
                    'ui:widget' => 'radio',
                    'ui:options' => [
                        'labels' => [
                            ['value' => 'email', 'label' => 'E-Mail'],
                            ['value' => 'phone', 'label' => 'Telefon'],
                            ['value' => 'post', 'label' => 'Post'],
                        ],
                    ],
                ],
                // date with minDate / maxDate
                'birth_date' => [
                    'ui:title' => 'Geburtsdatum',
                    'ui:widget' => 'date',
                    'ui:options' => [
                        'minDate' => '1900-01-01',
                        'maxDate' => '2099-12-31',
                    ],
                ],
                // email
                'email' => [
                    'ui:title' => 'E-Mail-Adresse',
                    'ui:widget' => 'email',
                    'ui:placeholder' => 'max@beispiel.de',
                ],
                // phone
                'phone_number' => [
                    'ui:title' => 'Telefonnummer',
                    'ui:widget' => 'phone',
                    'ui:placeholder' => '+49 123 456789',
                ],
            ],
        ]);
    }
}
