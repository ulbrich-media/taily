<?php

namespace Database\Seeders;

use Faker\Factory as Faker;
use Faker\Generator;
use Illuminate\Database\Seeder;
use Taily\Models\Adoption;
use Taily\Models\AdoptionFieldValue;
use Taily\Models\AnimalType;
use Taily\Models\FieldDefinition;
use Taily\Models\FieldGroup;
use Taily\Support\CaseFile\FieldCatalogue;

/**
 * The example dog catalogue from docs/features/case-file.md, and values for
 * every seeded adoption according to how far it has come — so the checklists
 * show a realistic mix of complete and incomplete adoptions.
 */
class CaseFileSeeder extends Seeder
{
    /**
     * Groups in display order, each with its fields. `types` limits a field
     * to animal type titles; `person` marks a built-in field (an applicant column of the adoption).
     */
    private const CATALOGUE = [
        [
            'title' => 'Über dich',
            'intro' => '',
            'fields' => [
                ['key' => 'first_name', 'label' => 'Vorname', 'type' => 'text', 'person' => 'first_name', 'collect_at' => 'application', 'required_for' => 'application'],
                ['key' => 'last_name', 'label' => 'Nachname', 'type' => 'text', 'person' => 'last_name', 'collect_at' => 'application', 'required_for' => 'application'],
                ['key' => 'email', 'label' => 'E-Mail', 'type' => 'email', 'person' => 'email', 'collect_at' => 'application', 'required_for' => 'application'],
                ['key' => 'phone', 'label' => 'Telefon', 'type' => 'phone', 'person' => 'phone', 'collect_at' => 'application'],
                ['key' => 'date_of_birth', 'label' => 'Geburtsdatum', 'type' => 'date', 'person' => 'date_of_birth', 'collect_at' => 'application', 'required_for' => 'contract', 'inspector' => false],
                ['key' => 'address', 'label' => 'Anschrift', 'type' => 'address', 'person' => 'address', 'collect_at' => 'application', 'required_for' => 'contract'],
                ['key' => 'occupation', 'label' => 'Beruf / Arbeitszeiten', 'type' => 'textarea', 'collect_at' => 'application'],
            ],
        ],
        [
            'title' => 'Wohnsituation',
            'intro' => '',
            'fields' => [
                ['key' => 'housing_info', 'label' => 'Wir fragen das, um einschätzen zu können, ob das Tier zu dir passt.', 'type' => 'info', 'collect_at' => 'application'],
                ['key' => 'housing_type', 'label' => 'Wohnform', 'type' => 'select', 'collect_at' => 'application', 'required_for' => 'application',
                    'options' => ['choices' => [
                        ['value' => 'apartment', 'label' => 'Wohnung'],
                        ['value' => 'house', 'label' => 'Haus'],
                        ['value' => 'farm', 'label' => 'Hof'],
                    ]]],
                ['key' => 'is_tenant', 'label' => 'Wohnst du zur Miete?', 'type' => 'boolean', 'collect_at' => 'application', 'required_for' => 'application'],
                ['key' => 'landlord_agrees', 'label' => 'Vermieter mit Tierhaltung einverstanden', 'type' => 'boolean', 'collect_at' => 'application', 'required_for' => 'application',
                    'condition' => ['field' => 'is_tenant', 'equals' => true]],
                ['key' => 'living_space_sqm', 'label' => 'Wohnfläche (m²)', 'type' => 'integer', 'collect_at' => 'application', 'required_for' => 'application', 'options' => ['min' => 1, 'max' => 10000]],
                ['key' => 'has_garden', 'label' => 'Garten vorhanden', 'type' => 'boolean', 'collect_at' => 'application', 'required_for' => 'application'],
                ['key' => 'garden_size_sqm', 'label' => 'Größe des Gartens (m²)', 'type' => 'integer', 'collect_at' => 'application', 'required_for' => 'application',
                    'options' => ['min' => 1], 'condition' => ['field' => 'has_garden', 'equals' => true]],
                ['key' => 'landlord_confirmation', 'label' => 'Vermieterbestätigung', 'type' => 'document', 'collect_at' => 'pre_inspection', 'review' => true,
                    'condition' => ['field' => 'is_tenant', 'equals' => true]],
                ['key' => 'home_video', 'label' => 'Hausvideo', 'type' => 'video', 'collect_at' => 'application',
                    'help' => 'Ein kurzes Video deines Zuhauses. Kann eine Vorkontrolle ersetzen.'],
            ],
        ],
        [
            'title' => 'Erfahrung & Alltag',
            'intro' => '',
            'fields' => [
                ['key' => 'dog_experience', 'label' => 'Bisherige Hundeerfahrung', 'type' => 'textarea', 'collect_at' => 'application', 'required_for' => 'application', 'types' => ['Hund']],
                ['key' => 'other_pets', 'label' => 'Weitere Tiere im Haushalt', 'type' => 'textarea', 'collect_at' => 'application'],
                ['key' => 'hours_alone', 'label' => 'Wie viele Stunden wäre das Tier täglich allein?', 'type' => 'integer', 'collect_at' => 'application', 'required_for' => 'application', 'options' => ['min' => 0, 'max' => 24]],
            ],
        ],
        [
            'title' => 'Für den Vertrag',
            'intro' => 'Diese Angaben brauchen wir erst für den Schutzvertrag.',
            'fields' => [
                ['key' => 'id_card_number', 'label' => 'Ausweisnummer', 'type' => 'text', 'collect_at' => 'contract', 'required_for' => 'contract', 'inspector' => false],
            ],
        ],
        [
            'title' => 'Ankunft',
            'intro' => '',
            'fields' => [
                ['key' => 'harness_info', 'label' => 'Ein Sicherheitsgeschirr hat einen zusätzlichen Bauchgurt. Ein normales Halsband oder Brustgeschirr reicht nicht – bitte fotografiere es.', 'type' => 'info', 'collect_at' => 'transport', 'types' => ['Hund']],
                ['key' => 'harness_photo', 'label' => 'Foto Sicherheitsgeschirr', 'type' => 'photo', 'collect_at' => 'transport', 'required_for' => 'transport', 'review' => true, 'types' => ['Hund']],
                ['key' => 'transport_day_phone', 'label' => 'Telefonnummer am Transporttag', 'type' => 'phone', 'collect_at' => 'transport', 'required_for' => 'transport'],
            ],
        ],
    ];

    private Generator $faker;

    public function run(): void
    {
        $this->faker = Faker::create('de_DE');

        $this->seedCatalogue();
        $this->seedValues();
    }

    /**
     * Every animal type gets its own copy of the catalogue, without the
     * fields that are meant for other types only.
     */
    private function seedCatalogue(): void
    {
        foreach (AnimalType::all() as $animalType) {
            foreach (self::CATALOGUE as $groupPosition => $group) {
                $fields = array_values(array_filter(
                    $group['fields'],
                    fn (array $field) => ! isset($field['types']) || in_array($animalType->title, $field['types'], true),
                ));

                if ($fields === []) {
                    continue;
                }

                $fieldGroup = FieldGroup::create([
                    'animal_type_id' => $animalType->id,
                    'title' => $group['title'],
                    'intro' => $group['intro'],
                    'position' => $groupPosition,
                ]);

                foreach ($fields as $position => $field) {
                    FieldDefinition::create([
                        'animal_type_id' => $animalType->id,
                        'key' => $field['key'],
                        'field_group_id' => $fieldGroup->id,
                        'position' => $position,
                        'type' => $field['type'],
                        'label' => $field['label'],
                        'help' => $field['help'] ?? '',
                        'options' => $field['options'] ?? null,
                        'applicant_attribute' => $field['person'] ?? null,
                        'collect_at' => $field['collect_at'],
                        'required_for' => $field['required_for'] ?? null,
                        'requires_review' => $field['review'] ?? false,
                        'visible_to_applicant' => true,
                        'visible_to_inspector' => $field['inspector'] ?? true,
                        'condition' => $field['condition'] ?? null,
                    ]);
                }
            }

            app(FieldCatalogue::class)->ensureBuiltIns($animalType);
        }
    }

    /**
     * Every application came with its application data (a few with gaps);
     * contract data exists once the contract was signed; transport data is
     * partly there once a transport is planned.
     */
    private function seedValues(): void
    {
        $catalogues = FieldDefinition::whereNull('applicant_attribute')->get()->groupBy('animal_type_id')
            ->map(fn ($definitions) => $definitions->keyBy('key'));

        Adoption::with(['animal.animalType'])->each(function (Adoption $adoption) use ($catalogues) {
            $definitions = $catalogues->get($adoption->animal?->animal_type_id, collect());
            $isDog = $adoption->animal?->animalType?->title === 'Hund';
            $signed = $adoption->contract_signed;

            // A few applications arrived incomplete.
            $complete = $signed || $this->faker->boolean(75);
            $isTenant = $this->faker->boolean(60);
            $hasGarden = $this->faker->boolean(55);

            $values = [
                'occupation' => $this->faker->boolean(70) ? $this->faker->jobTitle().', '.$this->faker->numberBetween(20, 40).' Std./Woche' : null,
                'housing_type' => $isTenant ? 'apartment' : $this->faker->randomElement(['house', 'farm']),
                'is_tenant' => $isTenant,
                'landlord_agrees' => $isTenant ? true : null,
                'living_space_sqm' => $this->faker->numberBetween(45, 220),
                'has_garden' => $hasGarden,
                'garden_size_sqm' => $hasGarden && $complete ? $this->faker->numberBetween(50, 2000) : null,
                'dog_experience' => $isDog && $complete ? $this->faker->sentence(14) : null,
                'other_pets' => $this->faker->boolean(40) ? $this->faker->randomElement(['Eine Katze', 'Zwei Kaninchen', 'Ein älterer Rüde']) : null,
                'hours_alone' => $complete ? $this->faker->numberBetween(0, 6) : null,
                'id_card_number' => $signed ? strtoupper($this->faker->bothify('L??#######')) : null,
                'transport_day_phone' => $adoption->transport_id !== null && $this->faker->boolean(60) ? $this->faker->phoneNumber() : null,
            ];

            foreach ($values as $key => $value) {
                if ($value === null || ! $definitions->has($key)) {
                    continue;
                }

                AdoptionFieldValue::create([
                    'adoption_id' => $adoption->id,
                    'field_definition_id' => $definitions->get($key)->id,
                    'value' => $value,
                ]);
            }

            // A signed contract printed the adopter's identity, so it exists.
            if ($signed) {
                $adoption->applicant_date_of_birth ??= $this->faker->dateTimeBetween('-70 years', '-18 years');

                if ($adoption->applicant_street_line === '') {
                    $adoption->applicant_street_line = $this->faker->streetAddress();
                    $adoption->applicant_postal_code = $this->faker->postcode();
                    $adoption->applicant_city = $this->faker->city();
                    $adoption->applicant_country_code = 'DE';
                }

                $adoption->save();
            }
        });
    }
}
