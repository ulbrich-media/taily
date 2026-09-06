<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\Organization;
use Taily\Models\Person;
use Taily\Models\User;
use Taily\Tests\TestCase;

class AdoptionContractGenerateTest extends TestCase
{
    use RefreshDatabase;

    private function createAdoption(): Adoption
    {
        $organization = Organization::create(['name' => 'Tierheim Musterstadt']);

        $animalType = AnimalType::create(['title' => 'Hund']);

        $animal = Animal::create([
            'animal_type_id' => $animalType->id,
            'name' => 'Bello',
            'gender' => 'male',
        ]);

        $mediator = Person::create([
            'first_name' => 'Maria',
            'last_name' => 'Vermittlerin',
            'organization_id' => $organization->id,
        ]);

        $applicant = Person::create([
            'first_name' => 'Anna',
            'last_name' => 'Übernehmerin',
        ]);

        return Adoption::create([
            'animal_id' => $animal->id,
            'mediator_id' => $mediator->id,
            'applicant_id' => $applicant->id,
            'contract_signed' => false,
        ]);
    }

    private function createUser(): User
    {
        return User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
        ]);
    }

    public function test_templates_lists_configured_templates(): void
    {
        $user = $this->createUser();
        $adoption = $this->createAdoption();

        $response = $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->getJson('/internal/adoptions/contract-templates');

        $response->assertOk();
        $response->assertJson([
            ['key' => 'default', 'label' => 'Schutzvertrag'],
        ]);

        // Doesn't accidentally hit /adoptions/{adoption} (resource show route).
        $this->assertNotEquals($adoption->id, $response->json('0.key'));
    }

    public function test_generate_downloads_a_pdf_for_a_valid_template(): void
    {
        $user = $this->createUser();
        $adoption = $this->createAdoption();

        $response = $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->get("/internal/adoptions/{$adoption->id}/contract/generate?template=default");

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_generate_does_not_change_adoption_state(): void
    {
        $user = $this->createUser();
        $adoption = $this->createAdoption();

        $this->assertFalse($adoption->contract_signed);

        $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->get("/internal/adoptions/{$adoption->id}/contract/generate?template=default")
            ->assertOk();

        $adoption->refresh();

        $this->assertFalse($adoption->contract_signed);
        $this->assertNull($adoption->contract_signed_at);
    }

    public function test_generate_rejects_an_unknown_template(): void
    {
        $user = $this->createUser();
        $adoption = $this->createAdoption();

        $response = $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->getJson("/internal/adoptions/{$adoption->id}/contract/generate?template=unknown");

        $response->assertStatus(422);
    }

    public function test_generate_requires_a_template_parameter(): void
    {
        $user = $this->createUser();
        $adoption = $this->createAdoption();

        $response = $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->getJson("/internal/adoptions/{$adoption->id}/contract/generate");

        $response->assertStatus(422);
    }
}
