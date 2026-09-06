<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Taily\Enums\ContractSignerRole;
use Taily\Enums\ContractSigningEventType;
use Taily\Enums\ContractSigningStatus;
use Taily\Exceptions\ContractSigningStateException;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\ContractSigningProcess;
use Taily\Models\Person;
use Taily\Support\ContractSigningService;
use Taily\Tests\TestCase;

class ContractSigningServiceTest extends TestCase
{
    use RefreshDatabase;

    private ContractSigningService $service;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('contract-signing-document');

        $this->service = new ContractSigningService;
    }

    private function createAdoption(): Adoption
    {
        $animalType = AnimalType::create(['title' => 'Hund']);

        $animal = Animal::create([
            'animal_type_id' => $animalType->id,
            'name' => 'Bello',
            'gender' => 'male',
        ]);

        $mediator = Person::create(['first_name' => 'Maria', 'last_name' => 'Vermittlerin']);
        $applicant = Person::create(['first_name' => 'Anna', 'last_name' => 'Übernehmerin']);

        return Adoption::create([
            'animal_id' => $animal->id,
            'mediator_id' => $mediator->id,
            'applicant_id' => $applicant->id,
            'contract_signed' => false,
        ]);
    }

    private function signMediator(ContractSigningProcess $process): void
    {
        $this->service->recordMediatorSignature(
            $process,
            typedName: 'Maria Vermittlerin',
            contractContentAccepted: true,
            privacyPolicyAccepted: true,
            informationConfirmed: true,
            ipAddress: '10.0.0.1',
            userAgent: 'PHPUnit',
        );
    }

    private function signAdopter(ContractSigningProcess $process): void
    {
        $this->service->recordAdopterSignature(
            $process,
            typedName: 'Anna Übernehmerin',
            contractContentAccepted: true,
            privacyPolicyAccepted: true,
            informationConfirmed: true,
            ipAddress: '10.0.0.2',
            userAgent: 'PHPUnit',
        );
    }

    public function test_happy_path_from_start_to_finalize(): void
    {
        $adoption = $this->createAdoption();

        $process = $this->service->start($adoption, 'default', '%PDF-unsigned-bytes');

        $this->assertSame(ContractSigningStatus::AWAITING_MEDIATOR_SIGNATURE, $process->status);
        $this->assertSame(hash('sha256', '%PDF-unsigned-bytes'), $process->unsigned_document_hash);
        $this->assertCount(1, $process->signers);
        $this->assertSame(ContractSignerRole::MEDIATOR, $process->signers->first()->role);
        $this->assertNotNull($process->signers->first()->activeToken());

        $this->signMediator($process);

        $this->assertSame(ContractSigningStatus::AWAITING_ADOPTER_SIGNATURE, $process->status);
        $process->load('signers');
        $this->assertCount(2, $process->signers);

        $mediator = $process->signers->firstWhere('role', ContractSignerRole::MEDIATOR);
        $adopter = $process->signers->firstWhere('role', ContractSignerRole::ADOPTER);
        $this->assertNotNull($mediator->signed_at);
        $this->assertNull($adopter->signed_at);
        $this->assertNotNull($adopter->activeToken());

        $this->signAdopter($process);

        $this->assertSame(ContractSigningStatus::COMPLETED, $process->status);
        $this->assertNotNull($process->completed_at);
        $this->assertNull($process->final_document_hash);

        $this->service->finalize($process, hash('sha256', 'final-artifact-bytes'));

        $this->assertSame(hash('sha256', 'final-artifact-bytes'), $process->final_document_hash);

        $eventTypes = $process->auditEvents()->get()->pluck('event_type')->map(fn ($type) => $type->value)->all();
        $this->assertSame([
            'link_generated',
            'signature_submitted',
            'link_generated',
            'signature_submitted',
            'finalized',
        ], $eventTypes);

        $finalizedEvent = $process->auditEvents()->where('event_type', ContractSigningEventType::FINALIZED->value)->first();
        $this->assertSame(hash('sha256', 'final-artifact-bytes'), $finalizedEvent->metadata['final_document_hash']);
    }

    public function test_recording_mediator_signature_rejects_a_cancelled_process(): void
    {
        $adoption = $this->createAdoption();
        $process = $this->service->start($adoption, 'default', '%PDF-bytes');

        $this->service->cancel($process, $adoption->mediator, 'Testabbruch');

        $this->expectException(ContractSigningStateException::class);

        $this->signMediator($process);
    }

    public function test_recording_adopter_signature_rejects_an_expired_process(): void
    {
        $adoption = $this->createAdoption();
        $process = $this->service->start($adoption, 'default', '%PDF-bytes');
        $this->signMediator($process);

        $this->service->expire($process);

        $this->expectException(ContractSigningStateException::class);

        $this->signAdopter($process);
    }

    public function test_recording_adopter_signature_rejects_an_already_completed_process(): void
    {
        $adoption = $this->createAdoption();
        $process = $this->service->start($adoption, 'default', '%PDF-bytes');
        $this->signMediator($process);
        $this->signAdopter($process);

        $this->expectException(ContractSigningStateException::class);

        $this->signAdopter($process);
    }

    public function test_cancel_invalidates_outstanding_signer_tokens(): void
    {
        $adoption = $this->createAdoption();
        $process = $this->service->start($adoption, 'default', '%PDF-bytes');
        $mediatorSigner = $process->signers->first();

        $this->service->cancel($process, $adoption->mediator, 'Mediator ist zurückgetreten');

        $this->assertSame(ContractSigningStatus::CANCELLED, $process->status);
        $this->assertSame('Mediator ist zurückgetreten', $process->cancellation_reason);
        $this->assertNotNull($process->terminated_at);
        $this->assertNull($mediatorSigner->fresh()->activeToken());

        $cancelledEvent = $process->auditEvents()
            ->where('event_type', ContractSigningEventType::CANCELLED->value)
            ->first();
        $this->assertNotNull($cancelledEvent);
        $this->assertSame($adoption->mediator->id, $cancelledEvent->metadata['canceled_by']);
    }

    public function test_cancel_rejects_an_already_cancelled_process(): void
    {
        $adoption = $this->createAdoption();
        $process = $this->service->start($adoption, 'default', '%PDF-bytes');
        $this->service->cancel($process, $adoption->mediator, null);

        $this->expectException(ContractSigningStateException::class);

        $this->service->cancel($process, $adoption->mediator, null);
    }

    public function test_cancel_rejects_a_non_mediator(): void
    {
        $adoption = $this->createAdoption();
        $process = $this->service->start($adoption, 'default', '%PDF-bytes');

        $this->expectException(ContractSigningStateException::class);

        try {
            $this->service->cancel($process, $adoption->applicant, null);
        } finally {
            $this->assertSame(ContractSigningStatus::AWAITING_MEDIATOR_SIGNATURE, $process->fresh()->status);
            $this->assertNotNull($process->signers->first()->fresh()->activeToken());
        }
    }

    public function test_audit_events_are_written_for_each_transition(): void
    {
        $adoption = $this->createAdoption();
        $process = $this->service->start($adoption, 'default', '%PDF-bytes');

        $mediatorSigner = $process->signers->first();
        $this->service->recordEmailSent($mediatorSigner);
        $this->service->recordLinkOpened($mediatorSigner, '10.0.0.1', 'PHPUnit');

        $this->signMediator($process);
        $this->signAdopter($process);

        $types = $process->auditEvents()->get()->pluck('event_type')->map(fn ($type) => $type->value)->all();

        $this->assertSame([
            'link_generated',
            'email_sent',
            'link_opened',
            'signature_submitted',
            'link_generated',
            'signature_submitted',
        ], $types);
    }
}
