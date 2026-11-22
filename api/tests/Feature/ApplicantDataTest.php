<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Taily\Enums\ContractSignerRole;
use Taily\Enums\UserRole;
use Taily\Models\Adoption;
use Taily\Models\AdoptionFieldValue;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\FieldDefinition;
use Taily\Models\FieldGroup;
use Taily\Models\Person;
use Taily\Models\PreInspection;
use Taily\Models\User;
use Taily\Support\CaseFile\FieldCatalogue;
use Taily\Support\ContractSigningService;
use Taily\Tests\TestCase;

/**
 * Applicant data on the adoption (ADR-018).
 */
class ApplicantDataTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private AnimalType $dogs;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['name' => 'Ada Admin', 'email' => 'ada@example.com', 'role' => UserRole::ADMIN]);
        $this->dogs = AnimalType::create(['title' => 'Hund']);
        app(FieldCatalogue::class)->ensureBuiltIns($this->dogs);

        $group = FieldGroup::where('animal_type_id', $this->dogs->id)->value('id');
        foreach ([['living_space_sqm', 'integer', false], ['harness_ok', 'boolean', true]] as $position => [$key, $type, $review]) {
            FieldDefinition::create([
                'animal_type_id' => $this->dogs->id, 'field_group_id' => $group, 'position' => 100 + $position,
                'key' => $key, 'type' => $type, 'label' => $key, 'collect_at' => 'application', 'requires_review' => $review,
            ]);
        }
    }

    public function test_an_adoption_started_from_a_person_copies_their_data_once(): void
    {
        $person = Person::create(['first_name' => 'Fiona', 'last_name' => 'Foster', 'email' => 'Fiona@Example.com ', 'city' => 'Köln']);

        $id = $this->as()->postJson('/internal/adoptions', [
            'animal_id' => $this->animal()->id,
            'applicant_person_id' => $person->id,
        ])->assertCreated()->json('data.id');

        $adoption = Adoption::find($id);
        $this->assertSame('Fiona Foster', $adoption->applicant_full_name);
        $this->assertSame('fiona@example.com', $adoption->applicant_email);
        $this->assertSame('Köln', $adoption->applicant_city);
        $this->assertSame($person->id, $adoption->applicant_person_id);

        // A reference, not a source: changing the Person leaves the adoption alone.
        $person->update(['city' => 'Bonn']);
        $this->assertSame('Köln', $adoption->fresh()->applicant_city);
        $this->as()->getJson("/internal/adoptions/{$id}")
            ->assertJsonPath('applicant.city', 'Köln')
            ->assertJsonPath('applicant_person.id', $person->id);
    }

    public function test_an_adoption_can_hold_its_applicant_without_any_person(): void
    {
        $this->as()->postJson('/internal/adoptions', ['animal_id' => $this->animal()->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['applicant_first_name', 'applicant_last_name']);

        $id = $this->as()->postJson('/internal/adoptions', [
            'animal_id' => $this->animal()->id,
            'applicant_first_name' => 'Anna',
            'applicant_last_name' => 'Neu',
            'applicant_email' => 'ANNA@example.com',
        ])->assertCreated()->json('data.id');

        $this->assertSame(0, Person::count());
        $this->assertSame('anna@example.com', Adoption::find($id)->applicant_email);

        // Linking later sets the reference only.
        $person = Person::create(['first_name' => 'Anna', 'last_name' => 'Anders']);
        $this->as()->putJson("/internal/adoptions/{$id}", ['applicant_person_id' => $person->id])->assertOk();
        $this->assertSame('Neu', Adoption::find($id)->applicant_last_name);
        $this->as()->putJson("/internal/adoptions/{$id}", ['applicant_person_id' => null])->assertOk();
        $this->assertNull(Adoption::find($id)->applicant_person_id);
    }

    public function test_built_in_fields_write_to_the_adoption_only(): void
    {
        $person = Person::create(['first_name' => 'Anna', 'last_name' => 'Alt', 'city' => 'Alt-Stadt']);
        $adoption = $this->adoption(['applicant_person_id' => $person->id, 'applicant_last_name' => 'Alt']);
        $other = $this->adoption(['applicant_person_id' => $person->id, 'applicant_last_name' => 'Alt']);

        $this->as()->putJson("/internal/adoptions/{$adoption->id}/case-file", ['values' => [
            'last_name' => 'Neu',
            'address' => ['street_line' => 'Weg 1', 'postal_code' => '10115', 'city' => 'Berlin'],
        ]])->assertOk();

        $this->assertSame('Neu', $adoption->fresh()->applicant_last_name);
        $this->assertSame('Berlin', $adoption->fresh()->applicant_city);
        $this->assertSame('Alt', $other->fresh()->applicant_last_name);
        $this->assertSame('Alt', $person->fresh()->last_name);
    }

    public function test_related_adoptions_are_found_by_email_or_person(): void
    {
        $person = Person::create(['first_name' => 'Anna', 'last_name' => 'Adopter']);
        $current = $this->adoption(['applicant_email' => 'anna@example.com', 'applicant_person_id' => $person->id]);
        $sameEmail = $this->adoption(['applicant_email' => 'ANNA@example.com']);
        $samePerson = $this->adoption(['applicant_email' => 'anna.alt@example.com', 'applicant_person_id' => $person->id]);
        $this->adoption(['applicant_email' => 'someone@example.com']);
        $this->adoption(['applicant_email' => '']);

        $related = collect($this->as()->getJson("/internal/adoptions/{$current->id}/related")->assertOk()->json())->keyBy('id');

        $this->assertEqualsCanonicalizing([$sameEmail->id, $samePerson->id], $related->keys()->all());
        $this->assertSame(['email'], $related[$sameEmail->id]['matched_by']);
        $this->assertSame(['person'], $related[$samePerson->id]['matched_by']);

        // Without an email and a Person, nothing is related.
        $alone = $this->adoption(['applicant_email' => '']);
        $this->assertSame([], $this->as()->getJson("/internal/adoptions/{$alone->id}/related")->json());
    }

    public function test_taking_over_fills_only_empty_fields(): void
    {
        $earlier = $this->adoption([
            'applicant_email' => 'anna@example.com', 'applicant_phone' => '0170 1', 'applicant_city' => 'Köln',
            'applicant_street_line' => 'Weg 1', 'applicant_postal_code' => '50667',
        ]);
        $this->value($earlier, 'living_space_sqm', 80);
        $this->value($earlier, 'harness_ok', true, AdoptionFieldValue::REVIEW_CONFIRMED);

        $current = $this->adoption(['applicant_email' => 'anna@example.com', 'applicant_phone' => '0221 2']);

        $response = $this->as()->postJson("/internal/adoptions/{$current->id}/case-file/import", ['from_adoption_id' => $earlier->id])->assertOk();

        $this->assertEqualsCanonicalizing(['Anschrift', 'living_space_sqm', 'harness_ok'], $response->json('filled'));
        $fresh = $current->fresh();
        $this->assertSame('0221 2', $fresh->applicant_phone, 'an existing value is never overwritten');
        $this->assertSame('Köln', $fresh->applicant_city);
        $harness = AdoptionFieldValue::where('adoption_id', $current->id)->whereRelation('fieldDefinition', 'key', 'harness_ok')->first();
        $this->assertTrue($harness->value);
        $this->assertNull($harness->review_status, 'a taken-over value is reviewed again');

        $stranger = $this->adoption(['applicant_email' => 'other@example.com']);
        $this->as()->postJson("/internal/adoptions/{$current->id}/case-file/import", ['from_adoption_id' => $stranger->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('from_adoption_id');
    }

    public function test_taking_over_skips_a_value_the_target_field_cannot_hold(): void
    {
        // On the cat catalogue the same key is a text field.
        $cats = AnimalType::create(['title' => 'Katze']);
        app(FieldCatalogue::class)->ensureBuiltIns($cats);
        $catSpace = FieldDefinition::create([
            'animal_type_id' => $cats->id, 'field_group_id' => FieldGroup::where('animal_type_id', $cats->id)->value('id'), 'position' => 100,
            'key' => 'living_space_sqm', 'type' => 'text', 'label' => 'Wohnfläche', 'collect_at' => 'application',
        ]);
        $earlier = Adoption::create([
            'animal_id' => Animal::create(['animal_type_id' => $cats->id, 'name' => 'Mimi', 'gender' => 'female'])->id,
            'applicant_first_name' => 'Anna', 'applicant_last_name' => 'Adopter', 'applicant_email' => 'anna@example.com',
        ]);
        AdoptionFieldValue::create(['adoption_id' => $earlier->id, 'field_definition_id' => $catSpace->id, 'value' => 'ziemlich groß', 'review_note' => '']);
        $this->value($earlier, 'harness_ok', true);

        $current = $this->adoption(['applicant_email' => 'anna@example.com']);
        $this->as()->postJson("/internal/adoptions/{$current->id}/case-file/import", ['from_adoption_id' => $earlier->id])->assertOk();

        $this->assertNull(AdoptionFieldValue::where('adoption_id', $current->id)->whereRelation('fieldDefinition', 'key', 'living_space_sqm')->first());
    }

    public function test_a_signer_keeps_the_name_and_email_they_were_invited_with(): void
    {
        Storage::fake('contract-signing-document');
        $mediator = Person::create(['first_name' => 'Maria', 'last_name' => 'Vermittlerin', 'email' => 'maria@example.com']);
        $adoption = $this->adoption(['mediator_id' => $mediator->id, 'applicant_first_name' => 'Anna', 'applicant_last_name' => 'Adopter', 'applicant_email' => 'anna@example.com']);
        $service = app(ContractSigningService::class);

        $process = $service->start($adoption, 'template', '%PDF-1.4');
        $service->recordMediatorSignature($process, 'Maria Vermittlerin', true, true, true);
        $adopter = $process->fresh()->signers->firstWhere('role', ContractSignerRole::ADOPTER);

        $this->assertSame('Anna Adopter', $adopter->name);
        $this->assertSame('anna@example.com', $adopter->email);
        $this->assertNull($adopter->person_id, 'the adoption references no Person');

        $adoption->update(['applicant_email' => 'neu@example.com']);
        $mediator->update(['email' => 'maria.neu@example.com']);
        $this->assertSame('anna@example.com', $adopter->fresh()->email);
        $this->assertSame('maria@example.com', $process->signers->firstWhere('role', ContractSignerRole::MEDIATOR)->fresh()->email);
    }

    public function test_a_persons_adoptions_include_those_with_their_email(): void
    {
        $person = Person::create(['first_name' => 'Fiona', 'last_name' => 'Foster', 'email' => 'Fiona@example.com']);
        Person::create(['first_name' => 'Otto', 'last_name' => 'Other', 'email' => 'otto@example.com']);
        $byEmail = $this->adoption(['applicant_email' => 'fiona@example.com']);
        PreInspection::create(['adoption_id' => $byEmail->id, 'memo' => '']);

        $ids = collect($this->as()->getJson("/internal/adoptions?filter[applicant_person_id]={$person->id}")->json('data'))->pluck('id');
        $this->assertSame([$byEmail->id], $ids->all());

        $adopters = collect($this->as()->getJson('/internal/persons?filter[has_adoptions]=1&per_page=50')->json('data'))->pluck('id');
        $this->assertSame([$person->id], $adopters->all());

        $inspections = $this->as()->getJson("/internal/pre-inspections?person_id={$person->id}")->json();
        $this->assertCount(1, $inspections);
    }

    private function animal(): Animal
    {
        return Animal::create(['animal_type_id' => $this->dogs->id, 'name' => 'Bello', 'gender' => 'male']);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function adoption(array $attributes = []): Adoption
    {
        return Adoption::create([
            'animal_id' => $this->animal()->id,
            'applicant_first_name' => 'Anna',
            'applicant_last_name' => 'Adopter',
            ...$attributes,
        ]);
    }

    private function value(Adoption $adoption, string $key, mixed $value, ?string $review = null): void
    {
        AdoptionFieldValue::create([
            'adoption_id' => $adoption->id,
            'field_definition_id' => FieldDefinition::where('animal_type_id', $this->dogs->id)->where('key', $key)->value('id'),
            'value' => $value,
            'review_status' => $review,
            'review_note' => '',
        ]);
    }

    private function as(): self
    {
        return $this->actingAs($this->user)->withHeader('referer', 'http://localhost');
    }
}
