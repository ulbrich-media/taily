<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Taily\Enums\UserRole;
use Taily\Models\Adoption;
use Taily\Models\AdoptionFieldValue;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\FieldDefinition;
use Taily\Models\FieldGroup;
use Taily\Models\Person;
use Taily\Models\User;
use Taily\Tests\TestCase;

class FieldCatalogueTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['name' => 'Ada Admin', 'email' => 'ada@example.com', 'role' => UserRole::ADMIN]);
    }

    public function test_a_new_animal_type_starts_with_the_built_in_fields(): void
    {
        $this->as($this->admin)->postJson('/internal/animal-types', ['title' => 'Kaninchen'])->assertCreated();
        $rabbits = AnimalType::where('title', 'Kaninchen')->firstOrFail();

        $catalogue = $this->as($this->admin)->getJson("/internal/animal-types/{$rabbits->id}/catalogue")->assertOk();

        $this->assertSame(['Über dich'], array_column($catalogue->json('groups'), 'title'));
        $this->assertSame(
            ['first_name', 'last_name', 'email', 'phone', 'mobile', 'date_of_birth', 'address'],
            array_column($catalogue->json('groups.0.fields'), 'key'),
        );
        $this->assertTrue($catalogue->json('groups.0.fields.0.built_in'));
    }

    public function test_groups_and_fields_are_configured_per_animal_type(): void
    {
        $dogs = $this->type('Hund');
        $cats = $this->type('Katze');

        $group = $this->as($this->admin)->postJson("/internal/animal-types/{$dogs->id}/field-groups", ['title' => 'Ankunft'])
            ->assertCreated()->json('data.groups.1.id');

        $this->as($this->admin)->postJson("/internal/field-groups/{$group}/fields", [
            'key' => 'harness_photo', 'type' => 'photo', 'label' => 'Foto Sicherheitsgeschirr',
            'collect_at' => 'transport', 'required_for' => 'transport', 'requires_review' => true,
        ])->assertCreated();

        // The same key is free on another animal type.
        $catGroup = FieldGroup::where('animal_type_id', $cats->id)->value('id');
        $this->as($this->admin)->postJson("/internal/field-groups/{$catGroup}/fields", [
            'key' => 'harness_photo', 'type' => 'photo', 'label' => 'Foto Transportbox', 'collect_at' => 'transport',
        ])->assertCreated();

        $this->assertSame(2, FieldDefinition::where('key', 'harness_photo')->count());
        $this->as($this->admin)->postJson("/internal/field-groups/{$group}/fields", [
            'key' => 'harness_photo', 'type' => 'text', 'label' => 'Doppelt', 'collect_at' => 'application',
        ])->assertUnprocessable()->assertJsonValidationErrors('key');
    }

    public function test_a_field_definition_is_validated(): void
    {
        $dogs = $this->type('Hund');
        $group = FieldGroup::where('animal_type_id', $dogs->id)->value('id');
        $create = fn (array $data) => $this->as($this->admin)->postJson("/internal/field-groups/{$group}/fields", $data + [
            'label' => 'Feld', 'collect_at' => 'application',
        ]);

        $create(['key' => 'Bad Key', 'type' => 'text'])->assertJsonValidationErrors('key');
        $create(['key' => 'email', 'type' => 'text'])->assertJsonValidationErrors('key');
        $create(['key' => 'address_2', 'type' => 'address'])->assertJsonValidationErrors('type');
        $create(['key' => 'housing', 'type' => 'select'])->assertJsonValidationErrors('options.choices');
        $create(['key' => 'too_early', 'type' => 'text', 'collect_at' => 'contract', 'required_for' => 'application'])
            ->assertJsonValidationErrors('required_for');
        $create(['key' => 'hint', 'type' => 'info', 'required_for' => 'application'])->assertJsonValidationErrors('required_for');
    }

    public function test_a_condition_depends_on_an_earlier_yes_no_or_choice_field(): void
    {
        $dogs = $this->type('Hund');
        $group = FieldGroup::where('animal_type_id', $dogs->id)->value('id');
        $create = fn (array $data) => $this->as($this->admin)->postJson("/internal/field-groups/{$group}/fields", $data + ['collect_at' => 'application']);

        $create(['key' => 'has_garden', 'type' => 'boolean', 'label' => 'Garten'])->assertCreated();
        $create(['key' => 'housing', 'type' => 'select', 'label' => 'Wohnform', 'options' => ['choices' => [
            ['value' => 'apartment', 'label' => 'Wohnung'], ['value' => 'house', 'label' => 'Haus'],
        ]]])->assertCreated();

        $create(['key' => 'garden_size', 'type' => 'integer', 'label' => 'Gartengröße', 'condition' => ['field' => 'has_garden', 'equals' => true]])
            ->assertCreated();
        $this->assertSame(['field' => 'has_garden', 'equals' => true], FieldDefinition::where('key', 'garden_size')->value('condition'));
        $create(['key' => 'landlord', 'type' => 'boolean', 'label' => 'Vermieter', 'condition' => ['field' => 'housing', 'in' => ['apartment']]])
            ->assertCreated();
        $this->assertSame(['field' => 'housing', 'in' => ['apartment']], FieldDefinition::where('key', 'landlord')->value('condition'));

        $create(['key' => 'bad_1', 'type' => 'text', 'label' => 'x', 'condition' => ['field' => 'garden_size', 'equals' => 1]])
            ->assertJsonValidationErrors('condition.field');
        $create(['key' => 'bad_2', 'type' => 'text', 'label' => 'x', 'condition' => ['field' => 'housing', 'in' => ['castle']]])
            ->assertJsonValidationErrors('condition.in');
        $create(['key' => 'bad_3', 'type' => 'text', 'label' => 'x', 'condition' => ['field' => 'has_garden', 'equals' => 'yes']])
            ->assertJsonValidationErrors('condition.equals');

        // Moving the controlling field below the dependent one is refused on the next save.
        $hasGarden = FieldDefinition::where('key', 'has_garden')->firstOrFail();
        $gardenSize = FieldDefinition::where('key', 'garden_size')->firstOrFail();
        $hasGarden->update(['position' => 99]);
        $this->as($this->admin)->putJson("/internal/field-definitions/{$gardenSize->id}", [
            'label' => 'Gartengröße', 'collect_at' => 'application', 'condition' => ['field' => 'has_garden', 'equals' => true],
        ])->assertJsonValidationErrors('condition.field');
    }

    public function test_key_and_type_are_fixed_and_built_ins_stay_built_in(): void
    {
        $dogs = $this->type('Hund');
        $email = FieldDefinition::where('animal_type_id', $dogs->id)->where('key', 'email')->firstOrFail();
        $dateOfBirth = FieldDefinition::where('animal_type_id', $dogs->id)->where('key', 'date_of_birth')->firstOrFail();

        $this->as($this->admin)->putJson("/internal/field-definitions/{$dateOfBirth->id}", [
            'key' => 'birthday', 'type' => 'text', 'label' => 'Geburtstag',
            'collect_at' => 'contract', 'required_for' => 'contract', 'visible_to_inspector' => false,
        ])->assertOk();

        $dateOfBirth->refresh();
        $this->assertSame(['date_of_birth', 'date', 'Geburtstag', 'contract'], [
            $dateOfBirth->key, $dateOfBirth->type->value, $dateOfBirth->label, $dateOfBirth->collect_at->value,
        ]);
        $this->assertFalse($dateOfBirth->visible_to_inspector);

        $this->as($this->admin)->putJson("/internal/field-definitions/{$email->id}", [
            'label' => 'E-Mail', 'collect_at' => 'application', 'required_for' => 'contract',
        ])->assertJsonValidationErrors('required_for');

        $this->as($this->admin)->postJson("/internal/field-definitions/{$email->id}/archive")->assertUnprocessable();
    }

    public function test_archiving_keeps_values_and_refuses_while_others_depend_on_the_field(): void
    {
        $dogs = $this->type('Hund');
        $group = FieldGroup::where('animal_type_id', $dogs->id)->value('id');
        $hasGarden = $this->field($group, 'has_garden', 'boolean');
        $gardenSize = $this->field($group, 'garden_size', 'integer', ['condition' => ['field' => 'has_garden', 'equals' => true]]);

        $this->as($this->admin)->postJson("/internal/field-definitions/{$hasGarden->id}/archive")
            ->assertUnprocessable()->assertJsonValidationErrors('field');

        $this->as($this->admin)->postJson("/internal/field-definitions/{$gardenSize->id}/archive")->assertOk();
        $this->assertNotNull($gardenSize->fresh()->archived_at);

        $this->as($this->admin)->deleteJson("/internal/field-definitions/{$gardenSize->id}/archive")->assertOk();
        $this->assertNull($gardenSize->fresh()->archived_at);
    }

    public function test_groups_and_fields_can_be_reordered_and_only_empty_groups_deleted(): void
    {
        $dogs = $this->type('Hund');
        $about = FieldGroup::where('animal_type_id', $dogs->id)->firstOrFail();
        $home = FieldGroup::create(['animal_type_id' => $dogs->id, 'title' => 'Wohnsituation', 'position' => 1]);

        $this->as($this->admin)->putJson("/internal/animal-types/{$dogs->id}/field-groups/order", ['ids' => [$home->id, $about->id]])
            ->assertOk()->assertJsonPath('data.groups.0.title', 'Wohnsituation');
        $this->as($this->admin)->putJson("/internal/animal-types/{$dogs->id}/field-groups/order", ['ids' => [$home->id]])
            ->assertUnprocessable();

        $fieldIds = FieldDefinition::where('field_group_id', $about->id)->orderBy('position')->pluck('id')->all();
        $this->as($this->admin)->putJson("/internal/field-groups/{$about->id}/fields/order", ['ids' => array_reverse($fieldIds)])
            ->assertOk()->assertJsonPath('data.groups.1.fields.0.key', 'address');

        $this->as($this->admin)->deleteJson("/internal/field-groups/{$about->id}")->assertUnprocessable();
        $this->as($this->admin)->deleteJson("/internal/field-groups/{$home->id}")->assertOk();
    }

    public function test_a_field_can_move_to_another_group(): void
    {
        $dogs = $this->type('Hund');
        $about = FieldGroup::where('animal_type_id', $dogs->id)->firstOrFail();
        $contract = FieldGroup::create(['animal_type_id' => $dogs->id, 'title' => 'Für den Vertrag', 'position' => 1]);
        $dateOfBirth = FieldDefinition::where('field_group_id', $about->id)->where('key', 'date_of_birth')->firstOrFail();

        $this->as($this->admin)->putJson("/internal/field-definitions/{$dateOfBirth->id}", [
            'label' => 'Geburtsdatum', 'collect_at' => 'contract', 'required_for' => 'contract', 'field_group_id' => $contract->id,
        ])->assertOk()->assertJsonPath('data.groups.1.fields.0.key', 'date_of_birth');

        $foreign = FieldGroup::where('animal_type_id', $this->type('Katze')->id)->value('id');
        $this->as($this->admin)->putJson("/internal/field-definitions/{$dateOfBirth->id}", [
            'label' => 'Geburtsdatum', 'collect_at' => 'contract', 'field_group_id' => $foreign,
        ])->assertJsonValidationErrors('field_group_id');
    }

    public function test_a_catalogue_can_be_copied_until_it_holds_adoption_data(): void
    {
        $dogs = $this->type('Hund');
        $cats = $this->type('Katze');
        $group = FieldGroup::where('animal_type_id', $dogs->id)->value('id');
        $this->field($group, 'has_garden', 'boolean');
        $this->field($group, 'garden_size', 'integer', ['condition' => ['field' => 'has_garden', 'equals' => true]]);

        $this->as($this->admin)->postJson("/internal/animal-types/{$cats->id}/catalogue/copy", ['from_animal_type_id' => $dogs->id])->assertOk();

        $catFields = FieldDefinition::where('animal_type_id', $cats->id)->pluck('condition', 'key');
        $this->assertSame(['field' => 'has_garden', 'equals' => true], $catFields['garden_size']);
        $this->assertSame(9, $catFields->count());

        $adoption = Adoption::create([
            'animal_id' => Animal::create(['animal_type_id' => $cats->id, 'name' => 'Mimi', 'gender' => 'female'])->id,
            'applicant_id' => Person::create(['first_name' => 'Anna', 'last_name' => 'A'])->id,
        ]);
        AdoptionFieldValue::create([
            'adoption_id' => $adoption->id,
            'field_definition_id' => FieldDefinition::where('animal_type_id', $cats->id)->where('key', 'has_garden')->value('id'),
            'value' => true,
        ]);

        $this->as($this->admin)->postJson("/internal/animal-types/{$cats->id}/catalogue/copy", ['from_animal_type_id' => $dogs->id])
            ->assertJsonValidationErrors('from_animal_type_id');
    }

    public function test_only_admins_change_the_catalogue(): void
    {
        $dogs = $this->type('Hund');
        $user = User::factory()->create(['name' => 'Uwe User', 'email' => 'uwe@example.com', 'role' => UserRole::USER]);

        $this->as($user)->getJson("/internal/animal-types/{$dogs->id}/catalogue")->assertOk();
        $this->as($user)->postJson("/internal/animal-types/{$dogs->id}/field-groups", ['title' => 'X'])->assertForbidden();
    }

    private function type(string $title): AnimalType
    {
        $this->as($this->admin)->postJson('/internal/animal-types', ['title' => $title])->assertCreated();

        return AnimalType::where('title', $title)->firstOrFail();
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function field(string $groupId, string $key, string $type, array $attributes = []): FieldDefinition
    {
        $this->as($this->admin)->postJson("/internal/field-groups/{$groupId}/fields", $attributes + [
            'key' => $key, 'type' => $type, 'label' => ucfirst($key), 'collect_at' => 'application',
        ])->assertCreated();

        return FieldDefinition::where('field_group_id', $groupId)->where('key', $key)->firstOrFail();
    }

    private function as(User $user): self
    {
        return $this->actingAs($user)->withHeader('referer', 'http://localhost');
    }
}
