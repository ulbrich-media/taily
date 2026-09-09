<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Taily\Enums\ContractSigningStatus;
use Taily\Mail\ContractSignerInviteMail;
use Taily\Mail\ContractSigningCancelledMail;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\ContractSigningProcess;
use Taily\Models\Person;
use Taily\Models\User;
use Taily\Support\ContractSigningService;
use Taily\Tests\TestCase;

class ContractSigningControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('contract-signing-document');
    }

    private function createAdoption(
        bool $withMediator = true,
        ?string $mediatorEmail = 'maria@example.com',
        string $applicantEmail = 'anna@example.com',
        bool $contractSigned = false,
    ): Adoption {
        $animalType = AnimalType::create(['title' => 'Hund']);

        $animal = Animal::create([
            'animal_type_id' => $animalType->id,
            'name' => 'Bello',
            'gender' => 'male',
        ]);

        $mediatorId = null;
        if ($withMediator) {
            $mediatorId = Person::create([
                'first_name' => 'Maria',
                'last_name' => 'Vermittlerin',
                'email' => $mediatorEmail ?? '',
            ])->id;
        }

        $applicant = Person::create([
            'first_name' => 'Anna',
            'last_name' => 'Übernehmerin',
            'email' => $applicantEmail,
        ]);

        return Adoption::create([
            'animal_id' => $animal->id,
            'mediator_id' => $mediatorId,
            'applicant_id' => $applicant->id,
            'contract_signed' => $contractSigned,
        ]);
    }

    private function createUser(): User
    {
        return User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
        ]);
    }

    public function test_store_starts_a_signing_process_and_emails_the_mediator(): void
    {
        Mail::fake();

        $user = $this->createUser();
        $adoption = $this->createAdoption();

        $response = $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->postJson("/internal/adoptions/{$adoption->id}/contract/signing", ['template' => 'default']);

        $response->assertCreated();
        $this->assertSame(
            ContractSigningStatus::AWAITING_MEDIATOR_SIGNATURE->value,
            $response->json('data.contract_signing_process.status')
        );

        Mail::assertSent(ContractSignerInviteMail::class, fn (ContractSignerInviteMail $mail) => $mail->hasTo('maria@example.com'));
    }

    public function test_store_marks_the_adoptions_contract_status_as_pending(): void
    {
        Mail::fake();

        $user = $this->createUser();
        $adoption = $this->createAdoption();

        $response = $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->postJson("/internal/adoptions/{$adoption->id}/contract/signing", ['template' => 'default']);

        $response->assertCreated();
        $this->assertSame('pending', $response->json('data.contract_status'));

        $index = $this->actingAs($user)->getJson('/internal/adoptions');
        $index->assertOk();
        $this->assertSame(
            'pending',
            collect($index->json())->firstWhere('id', $adoption->id)['contract_status']
        );
    }

    public function test_store_rejects_when_adoption_has_no_mediator(): void
    {
        Mail::fake();

        $user = $this->createUser();
        $adoption = $this->createAdoption(withMediator: false);

        $response = $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->postJson("/internal/adoptions/{$adoption->id}/contract/signing", ['template' => 'default']);

        $response->assertStatus(422);
        Mail::assertNothingSent();
    }

    public function test_store_rejects_when_mediator_has_no_email(): void
    {
        Mail::fake();

        $user = $this->createUser();
        $adoption = $this->createAdoption(mediatorEmail: '');

        $response = $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->postJson("/internal/adoptions/{$adoption->id}/contract/signing", ['template' => 'default']);

        $response->assertStatus(422);
        Mail::assertNothingSent();
    }

    public function test_store_rejects_when_applicant_has_no_email(): void
    {
        Mail::fake();

        $user = $this->createUser();
        $adoption = $this->createAdoption(applicantEmail: '');

        $response = $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->postJson("/internal/adoptions/{$adoption->id}/contract/signing", ['template' => 'default']);

        $response->assertStatus(422);
        Mail::assertNothingSent();
    }

    public function test_store_rejects_when_adoption_contract_is_already_signed(): void
    {
        Mail::fake();

        $user = $this->createUser();
        $adoption = $this->createAdoption(contractSigned: true);

        $response = $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->postJson("/internal/adoptions/{$adoption->id}/contract/signing", ['template' => 'default']);

        $response->assertStatus(422);
        Mail::assertNothingSent();
    }

    public function test_store_rejects_an_unknown_template(): void
    {
        $user = $this->createUser();
        $adoption = $this->createAdoption();

        $response = $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->postJson("/internal/adoptions/{$adoption->id}/contract/signing", ['template' => 'unknown']);

        $response->assertStatus(422);
    }

    public function test_store_rejects_a_second_active_process_for_the_same_adoption(): void
    {
        Mail::fake();

        $user = $this->createUser();
        $adoption = $this->createAdoption();

        $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->postJson("/internal/adoptions/{$adoption->id}/contract/signing", ['template' => 'default'])
            ->assertCreated();

        $response = $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->postJson("/internal/adoptions/{$adoption->id}/contract/signing", ['template' => 'default']);

        $response->assertStatus(422);
    }

    public function test_store_returns_json_401_when_unauthenticated(): void
    {
        $adoption = $this->createAdoption();

        $response = $this
            ->withHeader('referer', 'http://localhost')
            ->postJson("/internal/adoptions/{$adoption->id}/contract/signing", ['template' => 'default']);

        $response->assertStatus(401);
    }

    private function startSigningProcess(User $user, Adoption $adoption): ContractSigningProcess
    {
        $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->postJson("/internal/adoptions/{$adoption->id}/contract/signing", ['template' => 'default'])
            ->assertCreated();

        return $adoption->latestContractSigningProcess()->firstOrFail();
    }

    private function advanceToAwaitingAdopterSignature(ContractSigningProcess $process): void
    {
        app(ContractSigningService::class)->recordMediatorSignature(
            $process,
            typedName: 'Maria Vermittlerin',
            contractContentAccepted: true,
            privacyPolicyAccepted: true,
            informationConfirmed: true,
        );
    }

    public function test_cancel_from_awaiting_mediator_signature_sends_no_email(): void
    {
        Mail::fake();

        $user = $this->createUser();
        $adoption = $this->createAdoption();
        $process = $this->startSigningProcess($user, $adoption);
        $mediatorSigner = $process->signers->first();

        Mail::fake();

        $response = $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->postJson("/internal/adoptions/{$adoption->id}/contract/signing/cancel");

        $response->assertOk();
        $this->assertSame(
            ContractSigningStatus::CANCELLED->value,
            $response->json('data.contract_signing_process.status')
        );
        $this->assertNull($mediatorSigner->fresh()->activeToken());
        Mail::assertNothingSent();
    }

    public function test_cancel_from_awaiting_adopter_signature_emails_the_adopter(): void
    {
        Mail::fake();

        $user = $this->createUser();
        $adoption = $this->createAdoption();
        $process = $this->startSigningProcess($user, $adoption);
        $this->advanceToAwaitingAdopterSignature($process);

        Mail::fake();

        $response = $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->postJson("/internal/adoptions/{$adoption->id}/contract/signing/cancel");

        $response->assertOk();
        $this->assertSame(
            ContractSigningStatus::CANCELLED->value,
            $response->json('data.contract_signing_process.status')
        );
        Mail::assertSent(ContractSigningCancelledMail::class, fn (ContractSigningCancelledMail $mail) => $mail->hasTo('anna@example.com'));
    }

    public function test_cancel_on_an_already_terminal_process_does_not_mutate_state(): void
    {
        Mail::fake();

        $user = $this->createUser();
        $adoption = $this->createAdoption();
        $process = $this->startSigningProcess($user, $adoption);

        $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->postJson("/internal/adoptions/{$adoption->id}/contract/signing/cancel")
            ->assertOk();

        Mail::fake();

        $response = $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->postJson("/internal/adoptions/{$adoption->id}/contract/signing/cancel");

        $response->assertStatus(422);
        $this->assertSame(ContractSigningStatus::CANCELLED, $process->fresh()->status);
        Mail::assertNothingSent();
    }

    public function test_cancel_with_no_active_process_returns_an_error(): void
    {
        Mail::fake();

        $user = $this->createUser();
        $adoption = $this->createAdoption();

        $response = $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->postJson("/internal/adoptions/{$adoption->id}/contract/signing/cancel");

        $response->assertStatus(422);
        Mail::assertNothingSent();
    }

    public function test_cancel_returns_json_401_when_unauthenticated(): void
    {
        $adoption = $this->createAdoption();

        $response = $this
            ->withHeader('referer', 'http://localhost')
            ->postJson("/internal/adoptions/{$adoption->id}/contract/signing/cancel");

        $response->assertStatus(401);
    }

    public function test_resend_replaces_the_pending_signers_token_and_resends_mail(): void
    {
        Mail::fake();

        $user = $this->createUser();
        $adoption = $this->createAdoption();
        $process = $this->startSigningProcess($user, $adoption);
        $mediatorSigner = $process->signers->first();
        $oldToken = $mediatorSigner->activeToken()->token;

        Mail::fake();

        $response = $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->postJson("/internal/adoptions/{$adoption->id}/contract/signing/resend");

        $response->assertOk();
        $this->assertSame(
            ContractSigningStatus::AWAITING_MEDIATOR_SIGNATURE->value,
            $response->json('data.contract_signing_process.status')
        );

        $mediatorSigner->refresh();
        $this->assertNotNull($mediatorSigner->activeToken());
        $this->assertNotSame($oldToken, $mediatorSigner->activeToken()->token);

        Mail::assertSent(ContractSignerInviteMail::class, fn (ContractSignerInviteMail $mail) => $mail->hasTo('maria@example.com'));
    }

    public function test_resend_invalidates_the_previous_token(): void
    {
        Mail::fake();

        $user = $this->createUser();
        $adoption = $this->createAdoption();
        $process = $this->startSigningProcess($user, $adoption);
        $mediatorSigner = $process->signers->first();
        $oldToken = $mediatorSigner->activeToken()->token;

        $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->postJson("/internal/adoptions/{$adoption->id}/contract/signing/resend")
            ->assertOk();

        $this->assertNull(
            $mediatorSigner->accessTokens()->where('token_hash', hash('sha256', $oldToken))->where('expires_at', '>', now())->first()
        );
    }

    public function test_resend_rejects_a_terminal_process(): void
    {
        Mail::fake();

        $user = $this->createUser();
        $adoption = $this->createAdoption();
        $process = $this->startSigningProcess($user, $adoption);

        $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->postJson("/internal/adoptions/{$adoption->id}/contract/signing/cancel")
            ->assertOk();

        Mail::fake();

        $response = $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->postJson("/internal/adoptions/{$adoption->id}/contract/signing/resend");

        $response->assertStatus(422);
        Mail::assertNothingSent();
    }

    public function test_resend_with_no_active_process_returns_an_error(): void
    {
        Mail::fake();

        $user = $this->createUser();
        $adoption = $this->createAdoption();

        $response = $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->postJson("/internal/adoptions/{$adoption->id}/contract/signing/resend");

        $response->assertStatus(422);
        Mail::assertNothingSent();
    }

    public function test_resend_returns_json_401_when_unauthenticated(): void
    {
        $adoption = $this->createAdoption();

        $response = $this
            ->withHeader('referer', 'http://localhost')
            ->postJson("/internal/adoptions/{$adoption->id}/contract/signing/resend");

        $response->assertStatus(401);
    }
}
