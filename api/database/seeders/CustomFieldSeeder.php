<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\CustomFieldGroup;
use Taily\Models\FormTemplate;
use Taily\Models\Person;

/**
 * Example custom fields (see docs/features/custom-fields.md), with values on
 * the already seeded animals and persons. Runs last, because the values
 * depend on the animal types, the role assignments and the adoptions.
 *
 * Every values row is drawn from mt_rand, so `app:seed --seed=` reproduces it.
 */
class CustomFieldSeeder extends Seeder
{
    public function run(): void
    {
        $dogsAndCats = AnimalType::whereIn('title', ['Hund', 'Katze'])->pluck('id')->all();

        // Animal, Basis tab, dogs and cats: the size classification a website
        // can visualize, published through the Public API.
        $this->group('animal', 'basic', $this->template('Größe & Fell', [
            'expected_size' => $this->select('Erwartete Größe', ['small' => 'Klein', 'medium' => 'Mittel', 'large' => 'Groß']),
            'coat_type' => $this->select('Fellart', ['short' => 'Kurzhaar', 'medium' => 'Mittellang', 'long' => 'Langhaar']),
        ], required: ['expected_size']), animalTypes: $dogsAndCats, settings: [
            'expected_size' => ['public' => true],
            'coat_type' => ['public' => true],
        ]);

        // Animal, "Weitere Angaben" tab, every animal type.
        $this->group('animal', 'extra', $this->template('Alltag', [
            'favourite_toy' => $this->field('Lieblingsspielzeug', ['type' => 'string', 'maxLength' => 100]),
            'good_with_children' => $this->field('Kinderfreundlich', ['type' => 'boolean']),
            'feeding_notes' => $this->field('Fütterungshinweise', ['type' => 'string'], ['ui:widget' => 'textarea']),
        ]));

        // Person, adopters only: needed for the contract, but unknown when the
        // person is first created.
        $this->group('person', 'basic', $this->template('Ausweis', [
            'id_card_number' => $this->field('Ausweisnummer', ['type' => 'string', 'maxLength' => 20]),
            'id_card_checked' => $this->field('Ausweis geprüft', ['type' => 'boolean']),
        ], required: ['id_card_number']), roles: ['adopter']);

        // Person, fosters only.
        $this->group('person', 'basic', $this->template('Pflegestelle', [
            'foster_capacity' => $this->field('Plätze für Pflegetiere', ['type' => 'integer', 'minimum' => 0, 'maximum' => 20]),
            'has_garden' => $this->field('Garten vorhanden', ['type' => 'boolean']),
        ]), roles: ['foster'], position: 1);

        $this->fillAnimals();
        $this->fillPersons();
    }

    private function fillAnimals(): void
    {
        $toys = ['Ball', 'Quietscheente', 'Seil', 'Kuscheltier', 'Futterball', 'Federwedel'];

        Animal::with('animalType')->orderBy('id')->each(function (Animal $animal) use ($toys) {
            $values = [];

            if (in_array($animal->animalType?->title, ['Hund', 'Katze'], true)) {
                // A few stay incomplete, so "Fehlende Angaben" has something to show.
                if (mt_rand(1, 10) > 2) {
                    $values['expected_size'] = ['small', 'medium', 'large'][mt_rand(0, 2)];
                }
                if (mt_rand(0, 1)) {
                    $values['coat_type'] = ['short', 'medium', 'long'][mt_rand(0, 2)];
                }
            }

            if (mt_rand(0, 2) === 0) {
                $values['favourite_toy'] = $toys[mt_rand(0, count($toys) - 1)];
                $values['good_with_children'] = (bool) mt_rand(0, 1);
            }

            $this->store($animal, $values);
        });
    }

    private function fillPersons(): void
    {
        Person::withExists(['adoptionsAsApplicant', 'fosterAnimalTypes'])->orderBy('id')->each(function (Person $person) {
            $values = [];

            if ($person->adoptions_as_applicant_exists && mt_rand(1, 10) > 3) {
                $values['id_card_number'] = 'L'.strtoupper(substr(md5((string) mt_rand()), 0, 8));
                $values['id_card_checked'] = (bool) mt_rand(0, 1);
            }

            if ($person->foster_animal_types_exists) {
                $values['foster_capacity'] = mt_rand(1, 4);
                $values['has_garden'] = (bool) mt_rand(0, 1);
            }

            $this->store($person, $values);
        });
    }

    /**
     * Seeded values are written directly: they are known to be valid, and
     * going through the model would touch every record's updated_at.
     *
     * @param  array<string, mixed>  $values
     */
    private function store(Animal|Person $record, array $values): void
    {
        if ($values !== []) {
            $record->newQuery()->toBase()->where('id', $record->id)->update(['custom_fields' => json_encode($values)]);
        }
    }

    /**
     * @param  array<string, array{schema: array<string, mixed>, ui: array<string, mixed>}>  $fields
     * @param  list<string>  $required
     */
    private function template(string $name, array $fields, array $required = []): FormTemplate
    {
        $template = FormTemplate::create(['name' => "Zusatzfelder: {$name}"]);
        $template->versions()->create([
            'version' => 1,
            'schema' => [
                '$schema' => 'http://json-schema.org/draft-07/schema#',
                'title' => $name,
                'type' => 'object',
                'required' => $required,
                'properties' => array_map(fn ($field) => $field['schema'], $fields),
                'additionalProperties' => false,
            ],
            'ui_schema' => array_merge(
                ['ui:order' => array_keys($fields)],
                array_map(fn ($field) => $field['ui'], $fields),
            ),
        ]);

        return $template;
    }

    /**
     * @param  array<string, mixed>  $schema
     * @param  array<string, mixed>  $ui
     * @return array{schema: array<string, mixed>, ui: array<string, mixed>}
     */
    private function field(string $label, array $schema, array $ui = []): array
    {
        return ['schema' => $schema, 'ui' => array_merge(['ui:title' => $label], $ui)];
    }

    /**
     * @param  array<string, string>  $options  value => label
     * @return array{schema: array<string, mixed>, ui: array<string, mixed>}
     */
    private function select(string $label, array $options): array
    {
        return $this->field($label, ['type' => 'string', 'enum' => array_keys($options)], [
            'ui:options' => ['labels' => array_map(
                fn ($value, $optionLabel) => ['value' => $value, 'label' => $optionLabel],
                array_keys($options),
                $options,
            )],
        ]);
    }

    /**
     * @param  list<string>  $animalTypes
     * @param  list<string>  $roles
     * @param  array<string, array{public?: bool}>  $settings
     */
    private function group(string $entity, string $section, FormTemplate $template, array $animalTypes = [], array $roles = [], array $settings = [], int $position = 0): void
    {
        $group = CustomFieldGroup::create([
            'entity' => $entity,
            'section' => $section,
            'person_roles' => $roles,
            'form_template_id' => $template->id,
            'title' => str_replace('Zusatzfelder: ', '', $template->name),
            'position' => $position,
            'field_settings' => $settings,
        ]);
        $group->animalTypes()->sync($animalTypes);
    }
}
