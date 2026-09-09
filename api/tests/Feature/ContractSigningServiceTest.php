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
use Taily\Models\User;
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
        $this->assertSame($adoption->mediator->id, $cancelledEvent->metadata['authorized_by_person_id']);
        $this->assertNull($cancelledEvent->actor_user_id);
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
        $this->service->recordEmailSent($mediatorSigner, $mediatorSigner->person->email);
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

    public function test_start_records_the_acting_user_and_ip_on_the_link_generated_event(): void
    {
        $user = User::factory()->create(['name' => 'Admin User', 'email' => 'admin@example.com']);
        $adoption = $this->createAdoption();

        $process = $this->service->start($adoption, 'default', '%PDF-bytes', $user, '10.0.0.5', 'PHPUnit');

        $event = $process->auditEvents()->where('event_type', ContractSigningEventType::LINK_GENERATED->value)->first();
        $this->assertSame($user->id, $event->actor_user_id);
        $this->assertSame('10.0.0.5', $event->ip_address);
        $this->assertSame('PHPUnit', $event->user_agent);
    }

    public function test_cancel_records_the_acting_user_and_ip_alongside_who_authorized_it(): void
    {
        $user = User::factory()->create(['name' => 'Admin User', 'email' => 'admin@example.com']);
        $adoption = $this->createAdoption();
        $process = $this->service->start($adoption, 'default', '%PDF-bytes');

        $this->service->cancel($process, $adoption->mediator, null, $user, '10.0.0.6', 'PHPUnit');

        $event = $process->auditEvents()->where('event_type', ContractSigningEventType::CANCELLED->value)->first();
        $this->assertSame($user->id, $event->actor_user_id);
        $this->assertSame('10.0.0.6', $event->ip_address);
        $this->assertSame($adoption->mediator->id, $event->metadata['authorized_by_person_id']);
    }

    public function test_signer_identity_snapshot_survives_a_later_person_mutation(): void
    {
        $adoption = $this->createAdoption();
        $adoption->mediator->update(['email' => 'maria-original@example.com']);
        $process = $this->service->start($adoption, 'default', '%PDF-bytes');

        $linkGeneratedEvent = $process->auditEvents()->where('event_type', ContractSigningEventType::LINK_GENERATED->value)->first();
        $this->assertSame('Maria Vermittlerin', $linkGeneratedEvent->metadata['person_name']);
        $this->assertSame('maria-original@example.com', $linkGeneratedEvent->metadata['person_email']);

        $adoption->mediator->update(['first_name' => 'Marianne', 'email' => 'marianne-new@example.com']);

        $linkGeneratedEvent->refresh();
        $this->assertSame('Maria Vermittlerin', $linkGeneratedEvent->metadata['person_name']);
        $this->assertSame('maria-original@example.com', $linkGeneratedEvent->metadata['person_email']);
    }

    public function test_actor_identity_snapshot_survives_the_acting_users_deletion(): void
    {
        $user = User::factory()->create(['name' => 'Admin User', 'email' => 'admin@example.com']);
        $adoption = $this->createAdoption();
        $process = $this->service->start($adoption, 'default', '%PDF-bytes', $user);

        $event = $process->auditEvents()->where('event_type', ContractSigningEventType::LINK_GENERATED->value)->first();
        $this->assertSame('Admin User', $event->metadata['actor_name']);
        $this->assertSame('admin@example.com', $event->metadata['actor_email']);

        $user->delete();

        $event->refresh();
        $this->assertNull($event->actor_user_id);
        $this->assertSame('Admin User', $event->metadata['actor_name']);
        $this->assertSame('admin@example.com', $event->metadata['actor_email']);
    }

    public function test_signers_due_for_week_reminder_returns_signers_within_the_week_window(): void
    {
        $adoption = $this->createAdoption();
        $process = $this->service->start($adoption, 'default', '%PDF-bytes');
        $signer = $process->signers->first();
        $signer->activeToken()->update(['expires_at' => now()->addDays(6)]);

        $due = $this->service->signersDueForWeekReminder();

        $this->assertCount(1, $due);
        $this->assertSame($signer->id, $due->first()->id);
    }

    public function test_signers_due_for_week_reminder_excludes_signers_outside_the_window(): void
    {
        $adoption = $this->createAdoption();
        $process = $this->service->start($adoption, 'default', '%PDF-bytes');
        $process->signers->first()->activeToken()->update(['expires_at' => now()->addDays(10)]);

        $this->assertCount(0, $this->service->signersDueForWeekReminder());
    }

    public function test_signers_due_for_week_reminder_excludes_signers_inside_the_two_day_window(): void
    {
        $adoption = $this->createAdoption();
        $process = $this->service->start($adoption, 'default', '%PDF-bytes');
        $process->signers->first()->activeToken()->update(['expires_at' => now()->addDays(1)]);

        $this->assertCount(0, $this->service->signersDueForWeekReminder());
    }

    public function test_signers_due_for_two_day_reminder_returns_signers_within_the_two_day_window(): void
    {
        $adoption = $this->createAdoption();
        $process = $this->service->start($adoption, 'default', '%PDF-bytes');
        $signer = $process->signers->first();
        $signer->activeToken()->update(['expires_at' => now()->addDays(1)]);

        $due = $this->service->signersDueForTwoDayReminder();

        $this->assertCount(1, $due);
        $this->assertSame($signer->id, $due->first()->id);
    }

    public function test_mark_reminder_sent_is_not_due_again_for_the_same_threshold(): void
    {
        $adoption = $this->createAdoption();
        $process = $this->service->start($adoption, 'default', '%PDF-bytes');
        $signer = $process->signers->first();
        $signer->activeToken()->update(['expires_at' => now()->addDays(6)]);

        $this->assertCount(1, $this->service->signersDueForWeekReminder());

        $this->service->markReminderSent($signer, 'week');

        $this->assertCount(0, $this->service->signersDueForWeekReminder());
        $this->assertNotNull($signer->fresh()->week_reminder_sent_at);

        $event = $process->auditEvents()->where('event_type', ContractSigningEventType::EMAIL_SENT->value)->first();
        $this->assertSame('reminder', $event->metadata['type']);
        $this->assertSame('week', $event->metadata['threshold']);
        $this->assertSame($signer->person->full_name, $event->metadata['person_name']);
        $this->assertSame($signer->person->email, $event->metadata['person_email']);
    }

    public function test_record_email_sent_keeps_sent_to_email_authoritative_over_caller_metadata(): void
    {
        $adoption = $this->createAdoption();
        $process = $this->service->start($adoption, 'default', '%PDF-bytes');
        $signer = $process->signers->first();

        $this->service->recordEmailSent($signer, 'actually-sent-to@example.com', ['person_email' => 'spoofed@example.com']);

        $event = $process->auditEvents()->where('event_type', ContractSigningEventType::EMAIL_SENT->value)->first();
        $this->assertSame('actually-sent-to@example.com', $event->metadata['person_email']);
    }

    public function test_signed_signers_are_excluded_from_reminder_queries(): void
    {
        $adoption = $this->createAdoption();
        $process = $this->service->start($adoption, 'default', '%PDF-bytes');
        $process->signers->first()->activeToken()->update(['expires_at' => now()->addDays(6)]);

        $this->signMediator($process);

        $this->assertCount(0, $this->service->signersDueForWeekReminder());
    }

    public function test_signers_past_expiry_returns_a_signer_whose_token_has_expired(): void
    {
        $adoption = $this->createAdoption();
        $process = $this->service->start($adoption, 'default', '%PDF-bytes');
        $signer = $process->signers->first();
        $signer->accessTokens()->update(['expires_at' => now()->subDay()]);

        $pastExpiry = $this->service->signersPastExpiry();

        $this->assertCount(1, $pastExpiry);
        $this->assertSame($signer->id, $pastExpiry->first()->id);
    }

    public function test_signers_past_expiry_excludes_signers_with_a_still_valid_token(): void
    {
        $adoption = $this->createAdoption();
        $process = $this->service->start($adoption, 'default', '%PDF-bytes');

        $this->assertCount(0, $this->service->signersPastExpiry());
    }

    public function test_resend_replaces_the_pending_signers_token_and_resets_reminder_columns(): void
    {
        $adoption = $this->createAdoption();
        $process = $this->service->start($adoption, 'default', '%PDF-bytes');
        $signer = $process->signers->first();
        $oldToken = $signer->activeToken();
        $oldToken->update(['expires_at' => now()->addDays(6)]);
        $signer->update(['week_reminder_sent_at' => now()]);

        $resent = $this->service->resend($process);

        $this->assertSame($signer->id, $resent->id);
        $this->assertNotNull($resent->activeToken());
        $this->assertNotSame($oldToken->id, $resent->activeToken()->id);
        $this->assertNull($oldToken->fresh());
        $this->assertNull($resent->fresh()->week_reminder_sent_at);
        $this->assertNull($resent->fresh()->two_day_reminder_sent_at);
    }

    public function test_resend_itself_writes_no_audit_event(): void
    {
        $adoption = $this->createAdoption();
        $process = $this->service->start($adoption, 'default', '%PDF-bytes');
        $countBefore = $process->auditEvents()->count();

        $this->service->resend($process);

        $this->assertSame($countBefore, $process->auditEvents()->count());
    }

    public function test_record_email_sent_after_resend_writes_an_audit_event(): void
    {
        $adoption = $this->createAdoption();
        $process = $this->service->start($adoption, 'default', '%PDF-bytes');
        $signer = $process->signers->first();

        $resent = $this->service->resend($process);
        $this->service->recordEmailSent($resent, $signer->person->email, ['type' => 'resend']);

        $event = $process->auditEvents()
            ->where('event_type', ContractSigningEventType::EMAIL_SENT->value)
            ->where('signer_id', $signer->id)
            ->first();

        $this->assertNotNull($event);
        $this->assertSame('resend', $event->metadata['type']);
        $this->assertSame($signer->person->email, $event->metadata['person_email']);
    }

    public function test_resend_targets_the_adopter_once_the_mediator_has_signed(): void
    {
        $adoption = $this->createAdoption();
        $process = $this->service->start($adoption, 'default', '%PDF-bytes');
        $this->signMediator($process);

        $adopter = $process->signers->firstWhere('role', ContractSignerRole::ADOPTER);
        $oldToken = $adopter->activeToken();

        $resent = $this->service->resend($process);

        $this->assertSame($adopter->id, $resent->id);
        $this->assertNotSame($oldToken->id, $resent->activeToken()->id);
    }

    public function test_resend_rejects_a_completed_process(): void
    {
        $adoption = $this->createAdoption();
        $process = $this->service->start($adoption, 'default', '%PDF-bytes');
        $this->signMediator($process);
        $this->signAdopter($process);

        $this->expectException(ContractSigningStateException::class);

        $this->service->resend($process);
    }

    public function test_resend_rejects_a_cancelled_process(): void
    {
        $adoption = $this->createAdoption();
        $process = $this->service->start($adoption, 'default', '%PDF-bytes');
        $this->service->cancel($process, $adoption->mediator, null);

        $this->expectException(ContractSigningStateException::class);

        $this->service->resend($process);
    }

    public function test_cancelled_processes_are_excluded_from_reminder_and_expiry_queries(): void
    {
        $adoption = $this->createAdoption();
        $process = $this->service->start($adoption, 'default', '%PDF-bytes');
        $signer = $process->signers->first();
        $signer->accessTokens()->update(['expires_at' => now()->subDay()]);

        $this->service->cancel($process, $adoption->mediator, null);

        $this->assertCount(0, $this->service->signersDueForWeekReminder());
        $this->assertCount(0, $this->service->signersDueForTwoDayReminder());
        $this->assertCount(0, $this->service->signersPastExpiry());
    }
}
