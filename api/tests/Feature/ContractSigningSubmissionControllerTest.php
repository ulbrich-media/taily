<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Taily\Mail\ContractCompletionMail;
use Taily\Mail\ContractSignerInviteMail;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\ContractSigner;
use Taily\Models\Person;
use Taily\Support\ContractPdfService;
use Taily\Support\ContractSigningService;
use Taily\Tests\Concerns\EnforcesCsrfProtection;
use Taily\Tests\TestCase;

class ContractSigningSubmissionControllerTest extends TestCase
{
    use EnforcesCsrfProtection, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('contract-signing-document');
        Storage::fake('adoption-contract');
    }

    private function createAdoption(): Adoption
    {
        $animalType = AnimalType::create(['title' => 'Hund']);

        $animal = Animal::create([
            'animal_type_id' => $animalType->id,
            'name' => 'Bello',
            'gender' => 'male',
        ]);

        $mediator = Person::create([
            'first_name' => 'Maria',
            'last_name' => 'Vermittlerin',
            'email' => 'maria@example.com',
        ]);

        $applicant = Person::create([
            'first_name' => 'Anna',
            'last_name' => 'Übernehmerin',
            'email' => 'anna@example.com',
        ]);

        return Adoption::create([
            'animal_id' => $animal->id,
            'mediator_id' => $mediator->id,
            'applicant_id' => $applicant->id,
            'contract_signed' => false,
        ]);
    }

    private function startProcess(Adoption $adoption): ContractSigner
    {
        $pdf = (new ContractPdfService)->generate($adoption, 'default');
        $process = (new ContractSigningService)->start($adoption, 'default', $pdf);

        return $process->signers->first();
    }

    public function test_show_returns_review_data_and_logs_link_opened(): void
    {
        $adoption = $this->createAdoption();
        $mediatorSigner = $this->startProcess($adoption);
        $token = $mediatorSigner->activeToken()->token;

        $response = $this->getJson("/internal/contracts/{$token}");

        $response->assertOk();
        $response->assertJson([
            'role' => 'mediator',
            'animal' => ['name' => 'Bello', 'animal_type' => 'Hund'],
            'other_signer' => null,
        ]);

        $this->assertSame(1, $mediatorSigner->signingProcess->auditEvents()->where('event_type', 'link_opened')->count());
    }

    public function test_show_returns_a_generic_404_for_an_unknown_token(): void
    {
        $response = $this->getJson('/internal/contracts/unknown-token');

        $response->assertStatus(404);
    }

    public function test_document_streams_the_frozen_pdf(): void
    {
        $adoption = $this->createAdoption();
        $mediatorSigner = $this->startProcess($adoption);
        $token = $mediatorSigner->activeToken()->token;

        $response = $this->get("/internal/contracts/{$token}/document");

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_document_returns_a_generic_404_for_an_unknown_token(): void
    {
        $response = $this->get('/internal/contracts/unknown-token/document');

        $response->assertStatus(404);
    }

    public function test_full_happy_path_from_mediator_signature_to_completion(): void
    {
        Mail::fake();

        $adoption = $this->createAdoption();
        $mediatorSigner = $this->startProcess($adoption);
        $mediatorToken = $mediatorSigner->activeToken()->token;

        $mediatorResponse = $this->postJson("/internal/contracts/{$mediatorToken}/submit", [
            'typed_name' => 'Maria Vermittlerin',
            'contract_content_accepted' => true,
            'privacy_policy_accepted' => true,
            'information_confirmed' => true,
        ]);
        $mediatorResponse->assertOk();

        // The mediator's own link is now single-use spent.
        $this->getJson("/internal/contracts/{$mediatorToken}")->assertStatus(404);

        Mail::assertSent(ContractSignerInviteMail::class, fn (ContractSignerInviteMail $mail) => $mail->hasTo('anna@example.com'));

        $process = $mediatorSigner->signingProcess->fresh();
        $adopterSigner = $process->signers()->where('role', 'adopter')->firstOrFail();
        $adopterToken = $adopterSigner->activeToken()->token;

        $showResponse = $this->getJson("/internal/contracts/{$adopterToken}");
        $showResponse->assertOk();
        $showResponse->assertJson([
            'role' => 'adopter',
            'other_signer' => [
                'role' => 'mediator',
                'typed_name' => 'Maria Vermittlerin',
            ],
        ]);

        $adopterResponse = $this->postJson("/internal/contracts/{$adopterToken}/submit", [
            'typed_name' => 'Anna Übernehmerin',
            'contract_content_accepted' => true,
            'privacy_policy_accepted' => true,
            'information_confirmed' => true,
        ]);
        $adopterResponse->assertOk();

        $adoption->refresh();
        $this->assertTrue($adoption->contract_signed);
        $this->assertNotNull($adoption->contract_signed_at);
        $this->assertNotNull($adoption->getFirstMedia('contract'));

        $process->refresh();
        $this->assertSame('completed', $process->status->value);
        $this->assertNotNull($process->final_document_hash);
        $this->assertNotNull($process->getFirstMedia('final'));

        Mail::assertSent(ContractCompletionMail::class, fn (ContractCompletionMail $mail) => $mail->hasTo('maria@example.com'));
        Mail::assertSent(ContractCompletionMail::class, fn (ContractCompletionMail $mail) => $mail->hasTo('anna@example.com'));
    }

    public function test_submit_rejects_missing_consent_checkboxes(): void
    {
        $adoption = $this->createAdoption();
        $mediatorSigner = $this->startProcess($adoption);
        $token = $mediatorSigner->activeToken()->token;

        $response = $this->postJson("/internal/contracts/{$token}/submit", [
            'typed_name' => 'Maria Vermittlerin',
            'contract_content_accepted' => true,
            'privacy_policy_accepted' => false,
            'information_confirmed' => true,
        ]);

        $response->assertStatus(422);
    }

    public function test_submit_returns_a_generic_404_for_an_unknown_token(): void
    {
        $response = $this->postJson('/internal/contracts/unknown-token/submit', [
            'typed_name' => 'Someone',
            'contract_content_accepted' => true,
            'privacy_policy_accepted' => true,
            'information_confirmed' => true,
        ]);

        $response->assertStatus(404);
    }

    public function test_submit_rejects_a_replay_after_the_process_was_cancelled(): void
    {
        $adoption = $this->createAdoption();
        $mediatorSigner = $this->startProcess($adoption);
        $token = $mediatorSigner->activeToken()->token;

        (new ContractSigningService)->cancel($mediatorSigner->signingProcess, $adoption->mediator, null);

        $response = $this->postJson("/internal/contracts/{$token}/submit", [
            'typed_name' => 'Maria Vermittlerin',
            'contract_content_accepted' => true,
            'privacy_policy_accepted' => true,
            'information_confirmed' => true,
        ]);

        $response->assertStatus(404);
    }

    public function test_public_routes_are_rate_limited_per_token(): void
    {
        $adoption = $this->createAdoption();
        $mediatorSigner = $this->startProcess($adoption);
        $token = $mediatorSigner->activeToken()->token;

        for ($i = 0; $i < 20; $i++) {
            $this->getJson("/internal/contracts/{$token}")->assertOk();
        }

        $this->getJson("/internal/contracts/{$token}")->assertStatus(429);
    }

    public function test_submit_rejects_a_request_from_the_spa_session_without_a_csrf_token(): void
    {
        $this->enableCsrfEnforcement();

        $adoption = $this->createAdoption();
        $mediatorSigner = $this->startProcess($adoption);
        $token = $mediatorSigner->activeToken()->token;

        // Matches config('sanctum.stateful') (see .env's SANCTUM_STATEFUL_DOMAINS)
        // so the request is treated as coming from the SPA, which is what
        // pulls the session/CSRF middleware into the pipeline at all.
        $response = $this->withHeader('referer', 'http://taily.ddev.site:5544')
            ->postJson("/internal/contracts/{$token}/submit", [
                'typed_name' => 'Maria Vermittlerin',
                'contract_content_accepted' => true,
                'privacy_policy_accepted' => true,
                'information_confirmed' => true,
            ]);

        $response->assertStatus(419);
    }

    public function test_show_sets_a_referrer_policy_header(): void
    {
        $adoption = $this->createAdoption();
        $mediatorSigner = $this->startProcess($adoption);
        $token = $mediatorSigner->activeToken()->token;

        $response = $this->getJson("/internal/contracts/{$token}");

        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }
}
