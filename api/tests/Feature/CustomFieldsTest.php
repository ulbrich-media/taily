<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Taily\Enums\UserRole;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\CustomFieldGroup;
use Taily\Models\FormTemplate;
use Taily\Models\Person;
use Taily\Models\User;
use Taily\Tests\TestCase;

/**
 * Custom fields end to end: Field Groups, writing values, scope, missing
 * fields, removal with confirmation and the Public API.
 * See docs/features/custom-fields.md.
 */
class CustomFieldsTest extends TestCase
{
    use RefreshDatabase;

    private AnimalType $dogs;

    private AnimalType $cats;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->dogs = AnimalType::create(['title' => 'Hund']);
        $this->cats = AnimalType::create(['title' => 'Katze']);
        $this->admin = User::factory()->create(['name' => 'Admin', 'email' => 'admin@example.com', 'role' => UserRole::ADMIN]);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function sizeTemplate(): FormTemplate
    {
        return $this->template('Größe', [
            'expected_size' => ['type' => 'string', 'enum' => ['small', 'medium', 'large']],
            'coat' => ['type' => 'string', 'maxLength' => 20],
        ], ['expected_size'], [
            'expected_size' => [
                'ui:title' => 'Erwartete Größe',
                'ui:options' => ['labels' => [
                    ['value' => 'small', 'label' => 'Klein'],
                    ['value' => 'medium', 'label' => 'Mittel'],
                    ['value' => 'large', 'label' => 'Groß'],
                ]],
            ],
            'coat' => ['ui:title' => 'Fell'],
        ]);
    }

    private function idCardTemplate(): FormTemplate
    {
        return $this->template('Ausweis', [
            'id_card_number' => ['type' => 'string'],
        ], ['id_card_number'], ['id_card_number' => ['ui:title' => 'Ausweisnummer']]);
    }

    /**
     * @param  array<string, mixed>  $properties
     * @param  list<string>  $required
     * @param  array<string, mixed>  $ui
     */
    private function template(string $name, array $properties, array $required = [], array $ui = []): FormTemplate
    {
        $template = FormTemplate::create(['name' => $name]);
        $template->versions()->create([
            'version' => 1,
            'schema' => $this->schema($properties, $required),
            'ui_schema' => array_merge(['ui:order' => array_keys($properties)], $ui),
        ]);

        return $template;
    }

    /**
     * @param  array<string, mixed>  $properties
     * @param  list<string>  $required
     * @return array<string, mixed>
     */
    private function schema(array $properties, array $required = []): array
    {
        return [
            'type' => 'object',
            'properties' => $properties,
            'required' => $required,
            'additionalProperties' => false,
        ];
    }

    /**
     * @param  list<string>  $animalTypeIds
     * @param  list<string>  $roles
     * @param  array<string, mixed>  $settings
     */
    private function group(FormTemplate $template, string $entity = 'animal', array $animalTypeIds = [], array $roles = [], string $section = 'basic', array $settings = []): CustomFieldGroup
    {
        $group = CustomFieldGroup::create([
            'entity' => $entity,
            'section' => $section,
            'person_roles' => $roles,
            'form_template_id' => $template->id,
            'title' => $template->name,
            'position' => 0,
            'field_settings' => $settings,
        ]);
        $group->animalTypes()->sync($animalTypeIds);

        return $group;
    }

    private function api(): self
    {
        return $this->actingAs($this->admin)->withHeader('referer', 'http://localhost');
    }

    private function createAnimal(array $customFields, ?AnimalType $type = null): TestResponse
    {
        return $this->api()->postJson('/internal/animals', [
            'animal_type_id' => ($type ?? $this->dogs)->id,
            'name' => 'Bello',
            'gender' => 'male',
            'custom_fields' => $customFields,
        ]);
    }

    private function animal(array $customFields = [], ?AnimalType $type = null): Animal
    {
        $animal = new Animal([
            'animal_type_id' => ($type ?? $this->dogs)->id,
            'name' => 'Bello',
            'gender' => 'male',
        ]);
        $animal->custom_fields = $customFields;
        $animal->save();

        return $animal;
    }

    private function person(array $customFields = []): Person
    {
        $person = new Person(['first_name' => 'Anna', 'last_name' => 'Adopter', 'email' => 'anna@example.com']);
        $person->custom_fields = $customFields;
        $person->save();

        return $person;
    }

    // -------------------------------------------------------------------------
    // Writing values
    // -------------------------------------------------------------------------

    public function test_values_are_stored_on_create(): void
    {
        $this->group($this->sizeTemplate(), animalTypeIds: [$this->dogs->id]);

        $this->createAnimal(['expected_size' => 'large', 'coat' => 'lang'])
            ->assertCreated()
            ->assertJsonPath('data.custom_fields.expected_size', 'large')
            ->assertJsonPath('data.custom_fields.coat', 'lang');
    }

    public function test_required_fields_of_the_create_section_are_enforced_on_create(): void
    {
        $this->group($this->sizeTemplate(), animalTypeIds: [$this->dogs->id]);

        $this->createAnimal([])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['custom_fields.expected_size']);
    }

    public function test_required_fields_of_groups_out_of_scope_are_not_enforced(): void
    {
        $this->group($this->sizeTemplate(), animalTypeIds: [$this->dogs->id]);

        $this->createAnimal([], $this->cats)->assertCreated();
    }

    public function test_required_fields_on_other_sections_are_not_enforced_on_create(): void
    {
        $this->group($this->sizeTemplate(), section: 'extra');

        $this->createAnimal([])->assertCreated();
    }

    public function test_invalid_and_unknown_values_are_rejected(): void
    {
        $this->group($this->sizeTemplate());

        $this->createAnimal(['expected_size' => 'huge', 'unknown' => 'x'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['custom_fields.expected_size', 'custom_fields.unknown']);
    }

    public function test_update_only_validates_touched_groups(): void
    {
        $this->group($this->sizeTemplate());
        $animal = $this->animal();

        // Not touching the group: the missing required field does not block.
        $this->api()->putJson("/internal/animals/{$animal->id}", ['name' => 'Rex'])->assertOk();

        // Touching it: the required field is enforced.
        $this->api()->putJson("/internal/animals/{$animal->id}", ['custom_fields' => ['coat' => 'kurz']])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['custom_fields.expected_size']);
    }

    public function test_emptying_a_field_removes_its_key(): void
    {
        $this->group($this->sizeTemplate());
        $animal = $this->animal(['expected_size' => 'small', 'coat' => 'lang']);

        $this->api()->putJson("/internal/animals/{$animal->id}", ['custom_fields' => ['expected_size' => 'small', 'coat' => '']])
            ->assertOk();

        $this->assertSame(['expected_size' => 'small'], $animal->fresh()->custom_fields);
    }

    // -------------------------------------------------------------------------
    // Person roles and scope
    // -------------------------------------------------------------------------

    public function test_adopter_fields_apply_once_the_person_is_an_applicant(): void
    {
        $this->group($this->idCardTemplate(), 'person', roles: ['adopter']);

        // A new person holds no role: nothing is required.
        $this->api()->postJson('/internal/persons', ['first_name' => 'Anna', 'last_name' => 'A', 'email' => 'a@example.com'])
            ->assertCreated()
            ->assertJsonPath('data.custom_fields_missing', []);

        $person = Person::first();
        Adoption::create(['animal_id' => $this->animal()->id, 'applicant_id' => $person->id]);

        // Show endpoints are not wrapped in `data`.
        $this->api()->getJson("/internal/persons/{$person->id}")
            ->assertOk()
            ->assertJsonPath('custom_fields_missing.0.key', 'id_card_number');

        $this->api()->putJson("/internal/persons/{$person->id}", ['custom_fields' => ['id_card_number' => '']])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['custom_fields.id_card_number']);
    }

    public function test_filled_fields_stay_visible_after_leaving_scope(): void
    {
        $this->group($this->sizeTemplate(), animalTypeIds: [$this->dogs->id]);
        $animal = $this->animal(['expected_size' => 'large']);

        // Changing the type keeps the value and no longer requires the field.
        $this->api()->putJson("/internal/animals/{$animal->id}", [
            'animal_type_id' => $this->cats->id,
            'custom_fields' => ['expected_size' => 'large', 'coat' => ''],
        ])->assertOk()->assertJsonPath('data.custom_fields.expected_size', 'large');

        $this->api()->getJson("/internal/custom-fields/definitions?entity=animal&record_id={$animal->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.in_scope', false);

        // Out of scope the required field may be emptied; the group disappears.
        $this->api()->putJson("/internal/animals/{$animal->id}", ['custom_fields' => ['expected_size' => '', 'coat' => '']])
            ->assertOk();

        $this->api()->getJson("/internal/custom-fields/definitions?entity=animal&record_id={$animal->id}")
            ->assertJsonCount(0, 'data');
    }

    public function test_definitions_for_new_records_are_the_in_scope_groups(): void
    {
        $this->group($this->sizeTemplate(), animalTypeIds: [$this->dogs->id]);

        $this->api()->getJson("/internal/custom-fields/definitions?entity=animal&animal_type_id={$this->dogs->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.in_scope', true)
            ->assertJsonPath('data.0.template.schema.properties.expected_size.type', 'string');

        $this->api()->getJson("/internal/custom-fields/definitions?entity=animal&animal_type_id={$this->cats->id}")
            ->assertJsonCount(0, 'data');
    }

    public function test_adoption_reports_missing_fields_of_animal_and_applicant(): void
    {
        $this->group($this->sizeTemplate());
        $this->group($this->idCardTemplate(), 'person', roles: ['adopter']);
        $adoption = Adoption::create(['animal_id' => $this->animal()->id, 'applicant_id' => $this->person()->id]);

        $this->api()->getJson("/internal/adoptions/{$adoption->id}")
            ->assertOk()
            ->assertJsonPath('custom_fields_missing.animal.0.key', 'expected_size')
            ->assertJsonPath('custom_fields_missing.applicant.0.key', 'id_card_number');
    }

    // -------------------------------------------------------------------------
    // Field Groups
    // -------------------------------------------------------------------------

    public function test_admin_can_create_a_group(): void
    {
        $template = $this->sizeTemplate();

        $this->api()->postJson('/internal/custom-field-groups', [
            'entity' => 'animal',
            'section' => 'basic',
            'animal_type_ids' => [$this->dogs->id, $this->cats->id],
            'person_roles' => [],
            'form_template_id' => $template->id,
            'title' => 'Größe',
            'position' => 1,
            'field_settings' => ['expected_size' => ['public' => true]],
        ])->assertCreated()
            ->assertJsonPath('data.animal_types.1.title', 'Katze')
            ->assertJsonPath('data.fields.0.key', 'expected_size')
            ->assertJsonPath('data.fields.0.type', 'select')
            ->assertJsonPath('data.field_settings.expected_size.public', true);
    }

    public function test_non_admins_cannot_manage_groups(): void
    {
        $user = User::factory()->create(['name' => 'User', 'email' => 'user@example.com', 'role' => UserRole::USER]);

        $this->actingAs($user)->withHeader('referer', 'http://localhost')
            ->getJson('/internal/custom-field-groups')
            ->assertForbidden();
    }

    public function test_keys_must_be_unique_per_entity(): void
    {
        $this->group($this->sizeTemplate(), animalTypeIds: [$this->dogs->id]);
        $other = $this->template('Andere Größe', ['expected_size' => ['type' => 'string']]);

        $this->api()->postJson('/internal/custom-field-groups', [
            'entity' => 'animal',
            'section' => 'basic',
            'animal_type_ids' => [$this->cats->id],
            'person_roles' => [],
            'form_template_id' => $other->id,
            'title' => 'Andere',
            'position' => 0,
            'field_settings' => [],
        ])->assertUnprocessable()->assertJsonValidationErrors(['form_template_id']);
    }

    public function test_scope_must_match_the_entity(): void
    {
        $this->api()->postJson('/internal/custom-field-groups', [
            'entity' => 'person',
            'section' => 'extra',
            'animal_type_ids' => [$this->dogs->id],
            'person_roles' => ['unknown'],
            'form_template_id' => $this->idCardTemplate()->id,
            'title' => 'Ausweis',
            'position' => 0,
            'field_settings' => [],
        ])->assertUnprocessable()->assertJsonValidationErrors(['section', 'animal_type_ids', 'person_roles.0']);
    }

    public function test_deleting_a_group_with_values_needs_confirmation(): void
    {
        $group = $this->group($this->idCardTemplate(), 'person');
        $person = $this->person(['id_card_number' => 'L01X']);

        $this->api()->deleteJson("/internal/custom-field-groups/{$group->id}")
            ->assertStatus(409)
            ->assertJsonPath('removal_impact.0.key', 'id_card_number')
            ->assertJsonPath('removal_impact.0.count', 1);

        $this->assertDatabaseHas('custom_field_groups', ['id' => $group->id]);
        $this->assertSame(['id_card_number' => 'L01X'], $person->fresh()->custom_fields);

        $this->api()->deleteJson("/internal/custom-field-groups/{$group->id}", ['confirm_custom_field_removal' => true])
            ->assertOk();

        $this->assertDatabaseMissing('custom_field_groups', ['id' => $group->id]);
        $this->assertSame([], $person->fresh()->custom_fields);
    }

    public function test_deleting_a_group_without_values_needs_no_confirmation(): void
    {
        $group = $this->group($this->idCardTemplate(), 'person');

        $this->api()->deleteJson("/internal/custom-field-groups/{$group->id}")->assertOk();
    }

    // -------------------------------------------------------------------------
    // Template changes of bound templates
    // -------------------------------------------------------------------------

    private function updateTemplate(FormTemplate $template, array $properties, bool $confirm = false): TestResponse
    {
        return $this->api()->putJson("/internal/form-templates/{$template->id}", array_filter([
            'name' => $template->name,
            'schema' => $this->schema($properties),
            'ui_schema' => ['ui:order' => array_keys($properties)],
            'confirm_custom_field_removal' => $confirm ?: null,
        ]));
    }

    public function test_removing_a_field_deletes_its_values_after_confirmation(): void
    {
        $template = $this->sizeTemplate();
        $this->group($template);
        $animal = $this->animal(['expected_size' => 'large', 'coat' => 'lang']);
        $untouched = $this->animal(['expected_size' => 'small']);
        $properties = ['expected_size' => ['type' => 'string', 'enum' => ['small', 'medium', 'large']]];

        $this->updateTemplate($template, $properties)
            ->assertStatus(409)
            ->assertJsonCount(1, 'removal_impact')
            ->assertJsonPath('removal_impact.0.key', 'coat')
            ->assertJsonPath('removal_impact.0.count', 1);

        $this->assertArrayHasKey('coat', $template->fresh()->latestVersion->schema['properties']);

        $this->updateTemplate($template, $properties, confirm: true)->assertOk();

        $this->assertSame(['expected_size' => 'large'], $animal->fresh()->custom_fields);
        $this->assertSame(['expected_size' => 'small'], $untouched->fresh()->custom_fields);
    }

    public function test_removing_an_option_deletes_only_matching_values(): void
    {
        $template = $this->sizeTemplate();
        $this->group($template);
        $large = $this->animal(['expected_size' => 'large']);
        $small = $this->animal(['expected_size' => 'small']);
        $properties = [
            'expected_size' => ['type' => 'string', 'enum' => ['small', 'medium']],
            'coat' => ['type' => 'string', 'maxLength' => 20],
        ];

        $this->updateTemplate($template, $properties)
            ->assertStatus(409)
            ->assertJsonPath('removal_impact.0.option', 'large');

        $this->updateTemplate($template, $properties, confirm: true)->assertOk();

        $this->assertSame([], $large->fresh()->custom_fields);
        $this->assertSame(['expected_size' => 'small'], $small->fresh()->custom_fields);
    }

    public function test_changes_without_affected_values_need_no_confirmation(): void
    {
        $template = $this->sizeTemplate();
        $this->group($template);

        $this->updateTemplate($template, ['expected_size' => ['type' => 'string', 'enum' => ['small']]])->assertOk();
    }

    public function test_a_bound_template_cannot_take_a_key_of_another_group(): void
    {
        $this->group($this->sizeTemplate());
        $other = $this->template('Andere', ['other' => ['type' => 'string']]);
        $this->group($other);

        $this->updateTemplate($other, ['other' => ['type' => 'string'], 'coat' => ['type' => 'string']])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['schema']);
    }

    public function test_form_template_lists_where_it_is_bound(): void
    {
        $template = $this->sizeTemplate();
        $this->group($template);

        $this->api()->getJson("/internal/form-templates/{$template->id}")
            ->assertOk()
            ->assertJsonPath('data.custom_field_groups.0.entity', 'animal')
            ->assertJsonPath('data.custom_field_groups.0.section', 'basic');
    }

    // -------------------------------------------------------------------------
    // Presentation and Public API
    // -------------------------------------------------------------------------

    public function test_display_values_are_formatted(): void
    {
        $this->group($this->sizeTemplate());
        $animal = $this->animal(['expected_size' => 'large']);

        $this->assertSame('Groß', $animal->customField('expected_size'));
        $this->assertSame('', $animal->customField('coat'));
        $this->assertSame('', $animal->customField('unknown'));
    }

    public function test_public_api_returns_public_fields_of_in_scope_groups(): void
    {
        $this->group($this->sizeTemplate(), animalTypeIds: [$this->dogs->id], settings: ['expected_size' => ['public' => true]]);
        $this->animal(['expected_size' => 'large', 'coat' => 'lang'])->update(['do_publish' => true]);
        $this->animal([], $this->cats)->update(['do_publish' => true]);

        $token = $this->admin->createToken('website', ['animals:read:adoptable', 'animals:read:types'])->plainTextToken;

        $animals = $this->withToken($token)->getJson('/api/animals')->assertOk()->json();
        $dog = collect($animals)->firstWhere('animal_type_id', $this->dogs->id);
        $cat = collect($animals)->firstWhere('animal_type_id', $this->cats->id);

        $this->assertSame(
            ['expected_size' => ['label' => 'Erwartete Größe', 'type' => 'select', 'value' => 'large', 'display' => 'Groß']],
            $dog['custom_fields'],
        );
        $this->assertSame([], $cat['custom_fields']);

        $types = $this->withToken($token)->getJson('/api/animal-types')->assertOk()->json();
        $dogType = collect($types)->firstWhere('id', $this->dogs->id);

        $this->assertSame('expected_size', $dogType['custom_fields'][0]['key']);
        $this->assertSame(['value' => 'small', 'label' => 'Klein'], $dogType['custom_fields'][0]['options'][0]);
    }
}
