<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Taily\Enums\AdoptionStep;
use Taily\Enums\UserRole;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\ContractTemplate;
use Taily\Models\FieldDefinition;
use Taily\Models\FieldGroup;
use Taily\Models\Person;
use Taily\Models\User;
use Taily\Support\CaseFile\CaseFileService;
use Taily\Tests\TestCase;

class ContractTemplateTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private AnimalType $dogs;

    private AnimalType $cats;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['name' => 'Ada Admin', 'email' => 'ada@example.com', 'role' => UserRole::ADMIN]);
        $this->dogs = $this->type('Hund');
        $this->cats = $this->type('Katze');

        // Only the dog catalogue asks for an ID card number.
        $group = FieldGroup::where('animal_type_id', $this->dogs->id)->value('id');
        $this->as($this->admin)->postJson("/internal/field-groups/{$group}/fields", [
            'key' => 'id_card_number', 'type' => 'text', 'label' => 'Ausweisnummer', 'collect_at' => 'contract',
        ])->assertCreated();
        $this->as($this->admin)->postJson("/internal/field-groups/{$group}/fields", [
            'key' => 'home_video', 'type' => 'video', 'label' => 'Hausvideo', 'collect_at' => 'application',
        ])->assertCreated();
    }

    public function test_an_admin_configures_a_template(): void
    {
        $response = $this->as($this->admin)->postJson('/internal/contract-templates', $this->payload())->assertCreated();

        $this->assertSame('Schutzvertrag Hund', $response->json('data.name'));
        $this->assertSame([['id' => $this->dogs->id, 'title' => 'Hund']], $response->json('data.animal_types'));
        $this->assertSame([['key' => 'id_card_number', 'required' => true], ['key' => 'phone', 'required' => false]], $response->json('data.adopter_fields'));

        $id = $response->json('data.id');
        $this->as($this->admin)->putJson("/internal/contract-templates/{$id}", $this->payload(['title' => 'Übernahmevertrag']))
            ->assertOk()
            ->assertJsonPath('data.title', 'Übernahmevertrag');

        $this->as($this->admin)->postJson("/internal/contract-templates/{$id}/archive")->assertOk();
        $this->assertNotNull(ContractTemplate::find($id)->archived_at);
        $this->as($this->admin)->deleteJson("/internal/contract-templates/{$id}/archive")->assertOk();
        $this->assertNull(ContractTemplate::find($id)->archived_at);
    }

    public function test_only_admins_configure_templates(): void
    {
        $user = User::factory()->create(['name' => 'Uwe User', 'email' => 'uwe@example.com', 'role' => UserRole::USER]);

        $this->as($user)->getJson('/internal/contract-templates')->assertForbidden();
        $this->as($user)->postJson('/internal/contract-templates', $this->payload())->assertForbidden();
    }

    public function test_a_template_only_prints_known_fields(): void
    {
        $store = fn (array $overrides) => $this->as($this->admin)->postJson('/internal/contract-templates', $this->payload($overrides));

        $store(['animal_fields' => [['key' => 'mediator.full_name', 'required' => true]]])
            ->assertUnprocessable()->assertJsonValidationErrors('animal_fields.0.key');
        $store(['mediator_fields' => [['key' => 'mediator.shoe_size', 'required' => true]]])
            ->assertUnprocessable()->assertJsonValidationErrors('mediator_fields.0.key');
        // Files can't be printed.
        $store(['adopter_fields' => [['key' => 'home_video', 'required' => true]]])
            ->assertUnprocessable()->assertJsonValidationErrors('adopter_fields.0.key');
        $store(['animal_type_ids' => []])
            ->assertUnprocessable()->assertJsonValidationErrors('animal_type_ids');

        // The cat catalogue has no ID card number, so a template for both types can't print it.
        $message = $store(['animal_type_ids' => [$this->dogs->id, $this->cats->id]])
            ->assertUnprocessable()
            ->json('errors')['adopter_fields.0.key'][0];
        $this->assertStringContainsString('Katze', $message);
        $this->assertStringNotContainsString('Hund', $message);
    }

    public function test_field_options_list_the_printable_catalogue_fields_per_animal_type(): void
    {
        $options = $this->as($this->admin)->getJson('/internal/contract-templates/field-options')->assertOk();

        $this->assertContains('animal.tasso_id', array_column($options->json('animal'), 'key'));
        $this->assertContains('mediator.organization', array_column($options->json('mediator'), 'key'));

        $dogFields = array_column(collect($options->json('adopter'))->firstWhere('animal_type_id', $this->dogs->id)['fields'], 'key');
        $this->assertContains('id_card_number', $dogFields);
        $this->assertContains('address', $dogFields);
        $this->assertNotContains('home_video', $dogFields);
    }

    public function test_required_fields_become_contract_requirements_of_the_offered_animal_types_only(): void
    {
        $this->as($this->admin)->postJson('/internal/contract-templates', $this->payload([
            'animal_fields' => [['key' => 'animal.tasso_id', 'required' => true], ['key' => 'animal.color', 'required' => false]],
        ]))->assertCreated();

        // A fresh service each time: it remembers the requirements per animal type.
        $contract = fn (Adoption $adoption) => array_column(
            app(CaseFileService::class)->checklist($adoption, AdoptionStep::CONTRACT)->toArray()['items'],
            'key',
        );

        $dogItems = $contract($this->adoption($this->dogs));
        $this->assertContains('animal.tasso_id', $dogItems);
        $this->assertContains('id_card_number', $dogItems);
        $this->assertNotContains('animal.color', $dogItems);
        $this->assertNotContains('phone', $dogItems);

        $this->assertNotContains('animal.tasso_id', $contract($this->adoption($this->cats)));

        // An archived template requires nothing.
        ContractTemplate::query()->update(['archived_at' => now()]);
        $this->assertNotContains('animal.tasso_id', $contract($this->adoption($this->dogs)));
    }

    public function test_a_printed_field_cannot_be_archived(): void
    {
        $this->as($this->admin)->postJson('/internal/contract-templates', $this->payload())->assertCreated();
        $field = FieldDefinition::where('animal_type_id', $this->dogs->id)->where('key', 'id_card_number')->firstOrFail();

        $this->as($this->admin)->postJson("/internal/field-definitions/{$field->id}/archive")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('field');
    }

    public function test_generation_is_blocked_only_by_required_fields_of_the_chosen_template(): void
    {
        $template = $this->as($this->admin)->postJson('/internal/contract-templates', $this->payload([
            'adopter_fields' => [['key' => 'phone', 'required' => false]],
            'animal_fields' => [['key' => 'animal.name', 'required' => true]],
        ]))->json('data.id');
        $adoption = $this->adoption($this->dogs);

        // The phone is missing but optional for this template.
        $this->as($this->admin)->getJson("/internal/adoptions/{$adoption->id}/contract/generate?template={$template}")->assertOk();
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return $overrides + [
            'name' => 'Schutzvertrag Hund',
            'title' => 'Schutzvertrag',
            'body' => "## Bedingungen\n\nDas Tier wird artgerecht gehalten.",
            'animal_type_ids' => [$this->dogs->id],
            'animal_fields' => [['key' => 'animal.name', 'required' => true]],
            'mediator_fields' => [['key' => 'mediator.full_name', 'required' => false]],
            'adopter_fields' => [['key' => 'id_card_number', 'required' => true], ['key' => 'phone', 'required' => false]],
        ];
    }

    private function adoption(AnimalType $type): Adoption
    {
        $animal = Animal::create(['animal_type_id' => $type->id, 'name' => 'Bello', 'gender' => 'male']);

        return Adoption::create([
            'animal_id' => $animal->id,
            'applicant_id' => Person::create(['first_name' => 'Anna', 'last_name' => 'Übernehmerin'])->id,
            'contract_signed' => false,
        ]);
    }

    private function type(string $title): AnimalType
    {
        $this->as($this->admin)->postJson('/internal/animal-types', ['title' => $title])->assertCreated();

        return AnimalType::where('title', $title)->firstOrFail();
    }

    private function as(User $user): self
    {
        return $this->actingAs($user)->withHeader('referer', 'http://localhost');
    }
}
