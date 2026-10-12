<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Taily\Enums\ContractSignerRole;
use Taily\Enums\ContractSigningEventType;
use Taily\Enums\ContractSigningStatus;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\ContractSigningProcess;
use Taily\Models\Person;
use Taily\Models\User;
use Taily\Tests\TestCase;

class AdoptionContractUpdateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('adoption-contract');
    }

    private function createAdoption(bool $contractSigned = false): Adoption
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
            'contract_signed' => $contractSigned,
        ]);
    }

    private function createProcess(Adoption $adoption, ContractSigningStatus $status): ContractSigningProcess
    {
        $process = $adoption->contractSigningProcesses()->create([
            'template_key' => 'default',
            'unsigned_document_hash' => 'hash',
            'status' => $status,
        ]);

        $process->signers()->create(['person_id' => $adoption->mediator_id, 'role' => ContractSignerRole::MEDIATOR]);
        $process->signers()->create(['person_id' => $adoption->applicant_id, 'role' => ContractSignerRole::ADOPTER]);

        return $process;
    }

    private ?User $user = null;

    private function createUser(): User
    {
        return $this->user ??= User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
        ]);
    }

    private function saveContract(Adoption $adoption, array $data)
    {
        return $this->actingAs($this->createUser())
            ->withHeader('referer', 'http://localhost')
            ->putJson("/internal/adoptions/{$adoption->id}/contract", $data);
    }

    public function test_manual_save_works_without_a_signing_process(): void
    {
        $adoption = $this->createAdoption();

        $response = $this->saveContract($adoption, [
            'contract_signed' => true,
            'contract_signed_at' => '2026-10-01',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.contract_signed', true);
        $response->assertJsonPath('data.contract_source', 'manual');
        $this->assertTrue($adoption->fresh()->contract_signed);
    }

    public function test_manual_save_is_rejected_while_a_signing_process_is_active(): void
    {
        foreach ([ContractSigningStatus::AWAITING_MEDIATOR_SIGNATURE, ContractSigningStatus::AWAITING_ADOPTER_SIGNATURE] as $status) {
            $adoption = $this->createAdoption();
            $this->createProcess($adoption, $status);

            $this->saveContract($adoption, ['contract_signed' => true])
                ->assertUnprocessable()
                ->assertJsonValidationErrors('contract_signed');

            $this->assertFalse($adoption->fresh()->contract_signed);
        }
    }

    public function test_manual_save_is_rejected_after_a_digital_signing_completed(): void
    {
        $adoption = $this->createAdoption(contractSigned: true);
        $adoption->update(['contract_signed_at' => '2026-10-01']);
        $adoption->addMedia(UploadedFile::fake()->create('signed.pdf', 10, 'application/pdf'))
            ->toMediaCollection('contract');
        $this->createProcess($adoption, ContractSigningStatus::COMPLETED);

        $this->saveContract($adoption, ['contract_signed' => false, 'remove_file' => true])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('contract_signed');

        $adoption = $adoption->fresh();
        $this->assertTrue($adoption->contract_signed);
        $this->assertNotNull($adoption->getFirstMedia('contract'));
    }

    public function test_manual_save_is_allowed_after_a_cancelled_or_expired_process(): void
    {
        foreach ([ContractSigningStatus::CANCELLED, ContractSigningStatus::EXPIRED] as $status) {
            $adoption = $this->createAdoption();
            $this->createProcess($adoption, $status);

            $this->saveContract($adoption, ['contract_signed' => true])->assertOk();

            $this->assertTrue($adoption->fresh()->contract_signed);
        }
    }

    public function test_contract_source_is_digital_once_the_signing_process_completed(): void
    {
        $adoption = $this->createAdoption(contractSigned: true);
        $this->createProcess($adoption, ContractSigningStatus::COMPLETED);

        $this->assertSame('digital', $adoption->fresh()->contract_source);
    }

    public function test_contract_source_is_null_without_a_signed_contract(): void
    {
        $this->assertNull($this->createAdoption()->contract_source);
    }

    public function test_signer_invited_at_is_the_latest_invite_email(): void
    {
        $adoption = $this->createAdoption();
        $process = $this->createProcess($adoption, ContractSigningStatus::AWAITING_MEDIATOR_SIGNATURE);
        $mediatorSigner = $process->signers()->where('role', ContractSignerRole::MEDIATOR)->firstOrFail();

        foreach (['2026-10-01 09:00:00', '2026-10-03 12:30:00'] as $occurredAt) {
            $process->auditEvents()->create([
                'signer_id' => $mediatorSigner->id,
                'event_type' => ContractSigningEventType::EMAIL_SENT,
                'occurred_at' => $occurredAt,
            ]);
        }

        $response = $this->actingAs($this->createUser())
            ->withHeader('referer', 'http://localhost')
            ->getJson("/internal/adoptions/{$adoption->id}");

        $response->assertOk();
        $signers = collect($response->json('contract_signing_process.signers'));

        $this->assertStringStartsWith(
            '2026-10-03T12:30:00',
            $signers->firstWhere('role', 'mediator')['invited_at']
        );
        $this->assertNull($signers->firstWhere('role', 'adopter')['invited_at']);
    }
}
