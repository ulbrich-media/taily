<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Taily\Enums\ContractSigningStatus;
use Taily\Mail\ContractExpiredMail;
use Taily\Mail\ContractSignerReminderMail;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\ContractSigningProcess;
use Taily\Models\Person;
use Taily\Support\ContractSigningService;
use Taily\Tests\TestCase;

class ProcessContractSigningRemindersTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('contract-signing-document');
    }

    private function createAdoption(): Adoption
    {
        $animalType = AnimalType::create(['title' => 'Hund']);

        $animal = Animal::create([
            'animal_type_id' => $animalType->id,
            'name' => 'Bello',
            'gender' => 'male',
        ]);

        $mediator = Person::create(['first_name' => 'Maria', 'last_name' => 'Vermittlerin', 'email' => 'maria@example.com']);
        $applicant = Person::create(['first_name' => 'Anna', 'last_name' => 'Übernehmerin', 'email' => 'anna@example.com']);

        return Adoption::create([
            'animal_id' => $animal->id,
            'mediator_id' => $mediator->id,
            'applicant_id' => $applicant->id,
            'contract_signed' => false,
        ]);
    }

    private function startProcessWithMediatorTokenExpiringIn(int $days): ContractSigningProcess
    {
        $adoption = $this->createAdoption();
        $process = app(ContractSigningService::class)->start($adoption, 'default', '%PDF-bytes');
        $process->signers->first()->activeToken()->update(['expires_at' => now()->addDays($days)]);

        return $process;
    }

    public function test_sends_week_reminder_and_marks_it_sent(): void
    {
        Mail::fake();

        $process = $this->startProcessWithMediatorTokenExpiringIn(6);
        $signer = $process->signers->first();

        Artisan::call('contracts:process-reminders');

        Mail::assertSent(ContractSignerReminderMail::class, fn (ContractSignerReminderMail $mail) => $mail->hasTo('maria@example.com')
            && $mail->daysRemaining === 7
        );
        $this->assertNotNull($signer->fresh()->week_reminder_sent_at);
        $this->assertNull($signer->fresh()->two_day_reminder_sent_at);
    }

    public function test_sends_two_day_reminder_and_marks_it_sent(): void
    {
        Mail::fake();

        $process = $this->startProcessWithMediatorTokenExpiringIn(1);
        $signer = $process->signers->first();

        Artisan::call('contracts:process-reminders');

        Mail::assertSent(ContractSignerReminderMail::class, fn (ContractSignerReminderMail $mail) => $mail->hasTo('maria@example.com')
            && $mail->daysRemaining === 2
        );
        $this->assertNotNull($signer->fresh()->two_day_reminder_sent_at);
    }

    public function test_does_not_resend_a_reminder_already_marked(): void
    {
        Mail::fake();

        $process = $this->startProcessWithMediatorTokenExpiringIn(6);
        $signer = $process->signers->first();
        app(ContractSigningService::class)->markReminderSent($signer, 'week');

        Artisan::call('contracts:process-reminders');

        Mail::assertNothingSent();
    }

    public function test_expires_a_signer_past_expiry_and_notifies_the_mediator(): void
    {
        Mail::fake();

        $process = $this->startProcessWithMediatorTokenExpiringIn(-1);

        Artisan::call('contracts:process-reminders');

        $this->assertSame(ContractSigningStatus::EXPIRED, $process->fresh()->status);
        Mail::assertSent(ContractExpiredMail::class, fn (ContractExpiredMail $mail) => $mail->hasTo('maria@example.com'));
    }

    public function test_cancelled_processes_are_left_untouched(): void
    {
        Mail::fake();

        $process = $this->startProcessWithMediatorTokenExpiringIn(-1);
        app(ContractSigningService::class)->cancel($process, $process->adoption->mediator, null);

        Artisan::call('contracts:process-reminders');

        $this->assertSame(ContractSigningStatus::CANCELLED, $process->fresh()->status);
        Mail::assertNothingSent();
    }

    public function test_one_failed_reminder_send_does_not_block_the_rest_of_the_batch(): void
    {
        $processOne = $this->startProcessWithMediatorTokenExpiringIn(6);
        $signerOne = $processOne->signers->first();

        $processTwo = $this->startProcessWithMediatorTokenExpiringIn(6);
        $signerTwo = $processTwo->signers->first();

        $this->partialMock(ContractSigningService::class, function ($mock) use ($signerOne) {
            $mock->shouldReceive('markReminderSent')
                ->once()
                ->withArgs(fn ($signer, $threshold) => $signer->id === $signerOne->id && $threshold === 'week')
                ->andThrow(new RuntimeException('boom'));

            $mock->shouldReceive('markReminderSent')->passthru();
        });

        Mail::fake();

        $exitCode = Artisan::call('contracts:process-reminders');

        $this->assertSame(0, $exitCode);
        Mail::assertSentCount(2);
        $this->assertNull($signerOne->fresh()->week_reminder_sent_at);
        $this->assertNotNull($signerTwo->fresh()->week_reminder_sent_at);
    }
}
