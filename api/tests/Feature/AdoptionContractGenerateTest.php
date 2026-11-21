<?php

namespace Taily\Tests\Feature;

use Database\Seeders\ContractTemplateSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\URL;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\ContractTemplate;
use Taily\Models\Organization;
use Taily\Models\Person;
use Taily\Models\User;
use Taily\Tests\Concerns\CreatesContractTemplates;
use Taily\Tests\TestCase;

class AdoptionContractGenerateTest extends TestCase
{
    use CreatesContractTemplates;
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
            ...Adoption::applicantDataFrom($applicant),
            'applicant_person_id' => $applicant->id,
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

    public function test_templates_lists_the_templates_offered_for_the_animal_type(): void
    {
        $user = $this->createUser();
        $adoption = $this->createAdoption();
        $template = $this->contractTemplate($adoption);

        // Archived templates and templates for other animal types aren't offered.
        ContractTemplate::create([...ContractTemplateSeeder::DEFAULT, 'name' => 'Alt', 'archived_at' => now()])
            ->animalTypes()->attach($adoption->animal->animal_type_id);
        $this->contractTemplate(AnimalType::create(['title' => 'Katze']));
        ContractTemplate::create([...ContractTemplateSeeder::DEFAULT, 'name' => 'Nur Katzen'])
            ->animalTypes()->attach(AnimalType::firstWhere('title', 'Katze')->id);

        $response = $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->getJson("/internal/adoptions/{$adoption->id}/contract-templates");

        $response->assertOk();
        $response->assertExactJson([
            ['key' => $template->id, 'label' => 'Schutzvertrag (Beispielvorlage)'],
        ]);
    }

    public function test_generate_rejects_a_template_not_offered_for_the_animal_type(): void
    {
        $user = $this->createUser();
        $adoption = $this->createAdoption();
        $template = $this->contractTemplate(AnimalType::create(['title' => 'Katze']));

        $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->getJson("/internal/adoptions/{$adoption->id}/contract/generate?template={$template->id}")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('template');
    }

    public function test_generate_returns_a_signed_download_url(): void
    {
        $user = $this->createUser();
        $adoption = $this->createAdoption();

        $response = $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->getJson("/internal/adoptions/{$adoption->id}/contract/generate?template={$this->contractTemplate($adoption)->id}");

        $response->assertOk();
        $url = $response->json('url');

        $this->assertStringContainsString("/internal/adoptions/{$adoption->id}/contract/download", $url);
        $this->assertStringContainsString('signature=', $url);

        // The signed URL itself needs no session/auth to actually download the
        // file — prove it by dropping the authenticated session first. Must
        // target the "web" guard explicitly: the earlier auth:sanctum success
        // above flips Auth's *default* guard to "sanctum" for the rest of the
        // test (see Authenticate::authenticate()), so a bare actingAsGuest()/
        // assertGuest() would target "sanctum" instead — whose RequestGuard
        // just re-derives the user from the still-logged-in "web" session.
        $this->actingAsGuest('web');
        $this->assertGuest('web');
        $download = $this->get($url);
        $download->assertOk();
        $download->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringContainsString('no-store', $download->headers->get('Cache-Control'));
        $this->assertStringStartsWith('%PDF', $download->getContent());
    }

    public function test_generate_does_not_change_adoption_state(): void
    {
        $user = $this->createUser();
        $adoption = $this->createAdoption();

        $this->assertFalse($adoption->contract_signed);

        $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->get("/internal/adoptions/{$adoption->id}/contract/generate?template={$this->contractTemplate($adoption)->id}")
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

    public function test_generate_returns_json_401_when_unauthenticated(): void
    {
        $adoption = $this->createAdoption();

        // Deliberately a plain (non-JSON-Accept) request: this is what a
        // browser sends for a top-level navigation, e.g. an <a target="_blank">
        // download link. Regression test for the app crashing with
        // "Route [login] not defined" instead of a graceful 401, since this
        // API-only app has no named "login" route for Laravel's default
        // unauthenticated-redirect behaviour to target.
        $response = $this
            ->withHeader('referer', 'http://localhost')
            ->get("/internal/adoptions/{$adoption->id}/contract/generate?template={$this->contractTemplate($adoption)->id}");

        $response->assertStatus(401);
        $response->assertJson(['message' => 'Unauthenticated.']);
    }

    public function test_download_rejects_a_missing_or_invalid_signature(): void
    {
        $adoption = $this->createAdoption();

        $response = $this->get("/internal/adoptions/{$adoption->id}/contract/download?template={$this->contractTemplate($adoption)->id}");

        $response->assertForbidden();
    }

    public function test_download_rejects_a_tampered_query_parameter(): void
    {
        $adoption = $this->createAdoption();

        $signedUrl = URL::temporarySignedRoute('adoptions.contract.download', now()->addHour(), [
            'adoption' => $adoption->id,
            'template' => $this->contractTemplate($adoption)->id,
        ]);

        $tamperedUrl = str_replace('template=', 'template=0', $signedUrl);

        $response = $this->get($tamperedUrl);

        $response->assertForbidden();
    }

    public function test_download_is_rate_limited_per_signed_link(): void
    {
        $adoption = $this->createAdoption();

        $signedUrl = URL::temporarySignedRoute('adoptions.contract.download', now()->addHour(), [
            'adoption' => $adoption->id,
            'template' => $this->contractTemplate($adoption)->id,
        ]);

        // The limiter allows 10 requests per minute for a given signature.
        for ($i = 0; $i < 10; $i++) {
            $this->get($signedUrl)->assertOk();
        }

        $this->get($signedUrl)->assertStatus(429);
    }

    public function test_download_rate_limit_is_keyed_per_signature_not_per_ip(): void
    {
        $adoptionA = $this->createAdoption();
        $adoptionB = $this->createAdoption();

        $urlA = URL::temporarySignedRoute('adoptions.contract.download', now()->addHour(), [
            'adoption' => $adoptionA->id,
            'template' => $this->contractTemplate($adoptionA)->id,
        ]);
        $urlB = URL::temporarySignedRoute('adoptions.contract.download', now()->addHour(), [
            'adoption' => $adoptionB->id,
            'template' => $this->contractTemplate($adoptionB)->id,
        ]);

        for ($i = 0; $i < 10; $i++) {
            $this->get($urlA)->assertOk();
        }
        $this->get($urlA)->assertStatus(429);

        // A different signed link, from the same IP, is a different bucket.
        $this->get($urlB)->assertOk();
    }
}
