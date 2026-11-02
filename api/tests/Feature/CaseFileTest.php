<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Taily\Models\Adoption;
use Taily\Models\AdoptionFieldValue;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\FieldDefinition;
use Taily\Models\FieldGroup;
use Taily\Models\Person;
use Taily\Models\PreInspection;
use Taily\Models\Transport;
use Taily\Models\User;
use Taily\Support\ContractPdfService;
use Taily\Tests\TestCase;

class CaseFileTest extends TestCase
{
    use RefreshDatabase;

    private AnimalType $dogs;

    private AnimalType $cats;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->dogs = AnimalType::create(['title' => 'Hund']);
        $this->cats = AnimalType::create(['title' => 'Katze']);
        $this->user = User::factory()->create(['name' => 'Mia Mediator', 'email' => 'mia@example.com']);

        $this->catalogue($this->dogs, withHarness: true);
        $this->catalogue($this->cats, withHarness: false);
    }

    /**
     * Each animal type has its own catalogue; only dogs need a harness.
     */
    private function catalogue(AnimalType $type, bool $withHarness): void
    {
        $about = FieldGroup::create(['animal_type_id' => $type->id, 'title' => 'Über dich', 'position' => 0]);
        $home = FieldGroup::create(['animal_type_id' => $type->id, 'title' => 'Wohnsituation', 'position' => 1]);
        $contract = FieldGroup::create(['animal_type_id' => $type->id, 'title' => 'Für den Vertrag', 'position' => 2]);
        $arrival = FieldGroup::create(['animal_type_id' => $type->id, 'title' => 'Ankunft', 'position' => 3]);

        $this->define($about, 'first_name', 'text', 'Vorname', ['person_attribute' => 'first_name', 'required_for' => 'application']);
        $this->define($about, 'date_of_birth', 'date', 'Geburtsdatum', ['person_attribute' => 'date_of_birth', 'required_for' => 'contract']);
        $this->define($about, 'address', 'address', 'Anschrift', ['person_attribute' => 'address', 'required_for' => 'contract']);
        $this->define($home, 'living_space_sqm', 'integer', 'Wohnfläche', ['required_for' => 'application', 'options' => ['min' => 1]]);
        $this->define($home, 'has_garden', 'boolean', 'Garten vorhanden', ['required_for' => 'application']);
        $this->define($home, 'garden_size_sqm', 'integer', 'Gartengröße', [
            'required_for' => 'application',
            'condition' => ['field' => 'has_garden', 'equals' => true],
        ]);
        $this->define($home, 'housing_type', 'select', 'Wohnform', [
            'options' => ['choices' => [['value' => 'apartment', 'label' => 'Wohnung'], ['value' => 'house', 'label' => 'Haus']]],
        ]);
        $this->define($home, 'home_video', 'video', 'Hausvideo');
        $this->define($contract, 'id_card_number', 'text', 'Ausweisnummer', ['collect_at' => 'contract', 'required_for' => 'contract', 'visible_to_inspector' => false]);
        if ($withHarness) {
            $this->define($arrival, 'harness_photo', 'photo', 'Foto Sicherheitsgeschirr', ['collect_at' => 'transport', 'required_for' => 'transport', 'requires_review' => true]);
        }
        $this->define($arrival, 'transport_day_phone', 'phone', 'Telefon am Transporttag', ['collect_at' => 'transport', 'required_for' => 'transport']);
    }

    public function test_show_uses_the_catalogue_of_the_animals_type(): void
    {
        $catAdoption = $this->adoption($this->cats);

        $response = $this->api('get', $catAdoption)->assertOk();

        $keys = collect($response->json('groups'))->flatMap(fn ($group) => array_column($group['fields'], 'key'))->all();

        $this->assertSame(['Über dich', 'Wohnsituation', 'Für den Vertrag', 'Ankunft'], array_column($response->json('groups'), 'title'));
        $this->assertNotContains('harness_photo', $keys, 'a dog-only field shows up for a cat');
        $this->assertContains('transport_day_phone', $keys);

        $dogKeys = collect($this->api('get', $this->adoption($this->dogs))->json('groups'))
            ->flatMap(fn ($group) => array_column($group['fields'], 'key'));
        $this->assertContains('harness_photo', $dogKeys);
    }

    public function test_the_checklists_carry_requirements_forward(): void
    {
        $adoption = $this->adoption($this->dogs);

        $checklists = $this->api('get', $adoption)->json('checklists');

        $open = fn (string $step) => collect($checklists[$step]['items'])->where('status', '!=', 'done')->pluck('key')->all();

        $this->assertSame(['living_space_sqm', 'has_garden'], $open('application'));
        // The contract template prints the animal number; the animal has none.
        $this->assertEqualsCanonicalizing(
            ['living_space_sqm', 'has_garden', 'date_of_birth', 'address', 'id_card_number', 'animal.animal_number'],
            $open('contract'),
        );
        $this->assertContains('harness_photo', $open('transport'));
        $this->assertSame('animal', collect($checklists['contract']['items'])->firstWhere('key', 'animal.animal_number')['subject']);
    }

    public function test_update_writes_custom_values_to_the_adoption_and_built_ins_to_the_person(): void
    {
        $adoption = $this->adoption($this->dogs);

        $response = $this->api('put', $adoption, [
            'values' => [
                'first_name' => '  Anna-Lena ',
                'date_of_birth' => '1990-04-12',
                'address' => ['street_line' => 'Hauptstr. 1', 'postal_code' => '50667', 'city' => 'Köln'],
                'living_space_sqm' => '120',
                'has_garden' => true,
                'garden_size_sqm' => 300,
                'housing_type' => 'house',
            ],
        ])->assertOk();

        $applicant = $adoption->applicant->fresh();
        $this->assertSame('Anna-Lena', $applicant->first_name);
        $this->assertSame('1990-04-12', $applicant->date_of_birth->format('Y-m-d'));
        $this->assertSame('Köln', $applicant->city);

        $value = fn (string $key) => AdoptionFieldValue::where('adoption_id', $adoption->id)
            ->whereRelation('fieldDefinition', 'key', $key)->value('value');
        $this->assertSame(120, $value('living_space_sqm'));
        $this->assertTrue($value('has_garden'));
        $this->assertSame('house', $value('housing_type'));
        $this->assertSame(0, AdoptionFieldValue::whereRelation('fieldDefinition', 'person_attribute', '!=', null)->count());

        $this->assertTrue($response->json('data.checklists.application.complete'));
    }

    public function test_update_validates_per_field_type(): void
    {
        $adoption = $this->adoption($this->dogs);

        $this->api('put', $adoption, [
            'values' => [
                'first_name' => '',
                'living_space_sqm' => 'viel',
                'housing_type' => 'castle',
                'date_of_birth' => '12.04.1990',
                'home_video' => 'video.mp4',
                'unknown_field' => 'x',
            ],
        ])->assertUnprocessable()->assertJsonValidationErrors([
            'values.first_name',
            'values.living_space_sqm',
            'values.housing_type',
            'values.date_of_birth',
            'values.home_video',
            'values.unknown_field',
        ]);
    }

    public function test_a_conditional_field_is_only_required_when_its_condition_is_met(): void
    {
        $adoption = $this->adoption($this->dogs);

        $required = fn () => collect($this->api('get', $adoption)->json('checklists.application.items'))->pluck('key')->all();

        $this->api('put', $adoption, ['values' => ['has_garden' => false]])->assertOk();
        $this->assertNotContains('garden_size_sqm', $required());

        $this->api('put', $adoption, ['values' => ['has_garden' => true]])->assertOk();
        $this->assertContains('garden_size_sqm', $required());
    }

    public function test_the_mediator_can_require_waive_and_reset_a_field_per_adoption(): void
    {
        $adoption = $this->adoption($this->dogs);
        $this->actingAs($this->user)->withHeader('referer', 'http://localhost');
        $items = fn (string $step) => collect($this->api('get', $adoption)->json("checklists.{$step}.items"))->pluck('key')->all();

        $this->putJson("/internal/adoptions/{$adoption->id}/requirements/home_video", ['waived' => false, 'required_for' => 'pre_inspection'])->assertOk();
        $this->assertContains('home_video', $items('pre_inspection'));
        $this->assertSame('pending', $adoption->fresh()->pre_inspection_status, 'requesting the home video starts the pre-inspection step');

        $this->putJson("/internal/adoptions/{$adoption->id}/requirements/id_card_number", ['waived' => true])->assertOk();
        $this->assertNotContains('id_card_number', $items('contract'));

        $this->deleteJson("/internal/adoptions/{$adoption->id}/requirements/id_card_number")->assertOk();
        $this->assertContains('id_card_number', $items('contract'));

        $this->putJson("/internal/adoptions/{$adoption->id}/requirements/nope", ['waived' => true])->assertNotFound();
    }

    public function test_contract_generation_is_blocked_while_a_printed_field_is_missing(): void
    {
        $adoption = $this->adoption($this->dogs);

        $this->actingAs($this->user)->withHeader('referer', 'http://localhost')
            ->getJson("/internal/adoptions/{$adoption->id}/contract/generate?template=default")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('template');

        $message = $this->getJson("/internal/adoptions/{$adoption->id}/contract/generate?template=default")->json('errors.template.0');
        $this->assertStringContainsString('Ausweisnummer', $message);
        $this->assertStringContainsString('Tiernummer', $message);
        // Required for the application, but not printed — informs, doesn't block.
        $this->assertStringNotContainsString('Wohnfläche', $message);

        $adoption->animal->update(['animal_number' => 'H-1']);
        $this->api('put', $adoption, ['values' => [
            'date_of_birth' => '1990-04-12',
            'address' => ['street_line' => 'Hauptstr. 1', 'postal_code' => '50667', 'city' => 'Köln'],
        ]])->assertOk();
        $this->putJson("/internal/adoptions/{$adoption->id}/requirements/id_card_number", ['waived' => true])->assertOk();

        $this->getJson("/internal/adoptions/{$adoption->id}/contract/generate?template=default")->assertOk();
    }

    public function test_the_contract_prints_case_file_values(): void
    {
        $adoption = $this->adoption($this->dogs);
        $this->api('put', $adoption, ['values' => ['id_card_number' => 'L01X00T47']])->assertOk();

        $html = app(ContractPdfService::class)->renderBody($adoption->fresh(), 'default');

        $this->assertStringContainsString('L01X00T47', $html);
    }

    public function test_the_transport_checklist_covers_every_adoption_on_the_run(): void
    {
        $transport = Transport::create(['name' => 'Tour Süd']);
        $ready = $this->adoption($this->cats, 'Mimi');
        $waiting = $this->adoption($this->dogs, 'Bello');
        $ready->update(['transport_id' => $transport->id]);
        $waiting->update(['transport_id' => $transport->id]);

        $ready->animal->update(['animal_number' => 'K-1']);
        $ready->applicant->update(['date_of_birth' => '1990-01-01', 'street_line' => 'Weg 2', 'postal_code' => '10115', 'city' => 'Berlin']);
        $this->api('put', $ready, ['values' => ['living_space_sqm' => 80, 'has_garden' => false, 'id_card_number' => 'X', 'transport_day_phone' => '0170 123']])->assertOk();

        $response = $this->actingAs($this->user)->withHeader('referer', 'http://localhost')
            ->getJson("/internal/transports/{$transport->id}/checklist")
            ->assertOk();

        $this->assertSame(1, $response->json('complete'));
        $this->assertSame(2, $response->json('total'));
        $this->assertSame(['Bello', 'Mimi'], array_column(array_column($response->json('adoptions'), 'animal'), 'name'));
        $this->assertContains('harness_photo', array_column($response->json('adoptions.0.checklist.items'), 'key'));
    }

    public function test_the_mediator_confirms_the_pre_inspection_step(): void
    {
        $adoption = $this->adoption($this->dogs);

        $this->actingAs($this->user)->withHeader('referer', 'http://localhost')
            ->postJson("/internal/adoptions/{$adoption->id}/pre-inspection/confirm")
            ->assertOk()
            ->assertJsonPath('data.pre_inspection_status', 'finished')
            ->assertJsonPath('data.pre_inspection_confirmed_by.name', 'Mia Mediator');

        $this->deleteJson("/internal/adoptions/{$adoption->id}/pre-inspection/confirm")
            ->assertOk()
            ->assertJsonPath('data.pre_inspection_status', 'not_started');
    }

    public function test_the_inspector_only_sees_fields_marked_for_inspectors(): void
    {
        $adoption = $this->adoption($this->dogs);
        $this->api('put', $adoption, ['values' => ['living_space_sqm' => 200, 'has_garden' => false, 'id_card_number' => 'SECRET-ID']])->assertOk();

        $inspection = PreInspection::create(['adoption_id' => $adoption->id]);
        $token = $inspection->issueToken(now()->addDay())->token;

        $response = $this->getJson("/internal/inspect/{$token}")->assertOk();

        $keys = collect($response->json('case_file'))->flatMap(fn ($group) => array_column($group['fields'], 'key'));
        $this->assertContains('living_space_sqm', $keys);
        $this->assertNotContains('id_card_number', $keys);
        // A garden size that doesn't apply isn't shown either.
        $this->assertNotContains('garden_size_sqm', $keys);
        $this->assertStringNotContainsString('SECRET-ID', $response->getContent());
        $this->assertSame('Bello', $response->json('animal.name'));

        $this->postJson("/internal/inspect/{$token}/submit", ['verdict' => 'approved', 'memo' => 'Nur 120 m² ohne Dachboden.'])->assertOk();

        $inspection->refresh();
        $this->assertSame('approved', $inspection->verdict);
        $this->assertSame('Nur 120 m² ohne Dachboden.', $inspection->memo);
        $this->getJson("/internal/inspect/{$token}")->assertNotFound();
        // The verdict is a recommendation; the step stays open until the mediator confirms.
        $this->assertSame('pending', $adoption->fresh()->pre_inspection_status);
    }

    public function test_pre_inspections_are_listed_per_adoption_and_per_person(): void
    {
        $applicant = Person::create(['first_name' => 'Anna', 'last_name' => 'Adopter']);
        $first = $this->adoption($this->dogs, 'Rex', $applicant);
        $second = $this->adoption($this->cats, 'Mimi', $applicant);
        PreInspection::create(['adoption_id' => $first->id]);

        $get = fn (string $query) => $this->actingAs($this->user)->withHeader('referer', 'http://localhost')
            ->getJson("/internal/pre-inspections?{$query}")->assertOk()->json();

        $this->assertCount(0, $get("adoption_id={$second->id}"));
        $byPerson = $get("person_id={$applicant->id}");
        $this->assertCount(1, $byPerson);
        $this->assertSame('Rex', $byPerson[0]['adoption']['animal']['name']);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function define(FieldGroup $group, string $key, string $type, string $label, array $attributes = []): FieldDefinition
    {
        return FieldDefinition::create(array_merge([
            'animal_type_id' => $group->animal_type_id,
            'key' => $key,
            'field_group_id' => $group->id,
            'position' => FieldDefinition::where('field_group_id', $group->id)->count(),
            'type' => $type,
            'label' => $label,
            'collect_at' => 'application',
        ], $attributes));
    }

    private function adoption(AnimalType $type, string $name = 'Bello', ?Person $applicant = null): Adoption
    {
        return Adoption::create([
            'animal_id' => Animal::create(['animal_type_id' => $type->id, 'name' => $name, 'gender' => 'male'])->id,
            'applicant_id' => ($applicant ?? Person::create(['first_name' => 'Anna', 'last_name' => 'Adopter']))->id,
            'mediator_id' => Person::create(['first_name' => 'Maria', 'last_name' => 'Vermittlerin'])->id,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function api(string $method, Adoption $adoption, array $data = []): TestResponse
    {
        return $this->actingAs($this->user)
            ->withHeader('referer', 'http://localhost')
            ->json(strtoupper($method), "/internal/adoptions/{$adoption->id}/case-file", $data);
    }
}
