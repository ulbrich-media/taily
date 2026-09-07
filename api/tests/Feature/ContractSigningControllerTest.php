<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Taily\Enums\ContractSigningStatus;
use Taily\Mail\ContractSignerInviteMail;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\Person;
use Taily\Models\User;
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
}
