<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Taily\Mail\ApplicationDeclinedMail;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\Person;
use Taily\Models\User;
use Taily\Tests\TestCase;

class AdoptionAcceptDeclineTest extends TestCase
{
    use RefreshDatabase;

    private function adoption(string $status = 'pending', string $email = 'anna@example.com'): Adoption
    {
        $animal = Animal::create([
            'animal_type_id' => AnimalType::create(['title' => 'Hund'])->id,
            'name' => 'Bello',
            'gender' => 'male',
        ]);

        return Adoption::create([
            'animal_id' => $animal->id,
            'applicant_first_name' => 'Anna',
            'applicant_last_name' => 'Muster',
            'applicant_email' => $email,
            'status' => $status,
        ]);
    }

    private function signIn(): void
    {
        $this->actingAs(User::factory()->create(['name' => 'Mia Mediator', 'email' => 'mia@example.com']))->withHeader('referer', 'http://localhost');
    }

    public function test_accept_moves_pending_to_in_progress_and_sets_the_mediator(): void
    {
        $this->signIn();
        $adoption = $this->adoption();
        $mediator = Person::create(['first_name' => 'Maria', 'last_name' => 'Vermittlerin', 'email' => 'maria@example.com']);

        $this->postJson("/internal/adoptions/{$adoption->id}/accept", ['mediator_id' => $mediator->id])
            ->assertOk()
            ->assertJsonPath('data.status', 'in_progress');

        $this->assertSame($mediator->id, $adoption->fresh()->mediator_id);
    }

    public function test_accept_works_without_a_mediator(): void
    {
        $this->signIn();
        $adoption = $this->adoption();

        $this->postJson("/internal/adoptions/{$adoption->id}/accept")->assertOk();

        $this->assertSame('in_progress', $adoption->fresh()->status);
        $this->assertNull($adoption->fresh()->mediator_id);
    }

    public function test_accept_rejects_an_unknown_mediator(): void
    {
        $this->signIn();
        $adoption = $this->adoption();

        $this->postJson("/internal/adoptions/{$adoption->id}/accept", ['mediator_id' => '00000000-0000-0000-0000-000000000000'])
            ->assertUnprocessable();

        $this->assertSame('pending', $adoption->fresh()->status);
    }

    public function test_accept_and_decline_are_only_allowed_from_pending(): void
    {
        $this->signIn();
        Mail::fake();

        foreach (['unconfirmed', 'in_progress', 'canceled', 'done'] as $status) {
            $adoption = $this->adoption($status);

            $this->postJson("/internal/adoptions/{$adoption->id}/accept")->assertUnprocessable();
            $this->postJson("/internal/adoptions/{$adoption->id}/decline", ['internal_reason' => 'Nein'])->assertUnprocessable();
            $this->assertSame($status, $adoption->fresh()->status);
        }

        Mail::assertNothingSent();
    }

    public function test_decline_requires_an_internal_reason(): void
    {
        $this->signIn();
        $adoption = $this->adoption();

        $this->postJson("/internal/adoptions/{$adoption->id}/decline", ['applicant_reason' => 'Schade'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('internal_reason');
        $this->postJson("/internal/adoptions/{$adoption->id}/decline", ['internal_reason' => '   '])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('internal_reason');

        $this->assertSame('pending', $adoption->fresh()->status);
    }

    public function test_decline_cancels_stores_the_internal_reason_and_mails_the_applicant(): void
    {
        $this->signIn();
        Mail::fake();
        $adoption = $this->adoption();

        $this->postJson("/internal/adoptions/{$adoption->id}/decline", [
            'internal_reason' => 'Kein Garten vorhanden',
            'applicant_reason' => 'Der Hund braucht einen Garten.',
        ])->assertOk()->assertJsonPath('data.status', 'canceled');

        $fresh = $adoption->fresh();
        $this->assertSame('canceled', $fresh->status);
        $this->assertSame('Kein Garten vorhanden', $fresh->canceled_reason);
        $this->assertNotNull($fresh->canceled_at);

        Mail::assertSent(ApplicationDeclinedMail::class, function (ApplicationDeclinedMail $mail) {
            $html = $mail->render();

            return $mail->hasTo('anna@example.com')
                && str_contains($html, 'Der Hund braucht einen Garten.')
                && str_contains($html, 'Anna')
                && ! str_contains($html, 'Kein Garten vorhanden');
        });
    }

    public function test_decline_without_applicant_reason_still_mails(): void
    {
        $this->signIn();
        Mail::fake();
        $adoption = $this->adoption();

        $this->postJson("/internal/adoptions/{$adoption->id}/decline", ['internal_reason' => 'Intern'])->assertOk();

        Mail::assertSent(ApplicationDeclinedMail::class, fn (ApplicationDeclinedMail $mail) => $mail->applicantReason === '');
    }

    public function test_decline_sends_no_mail_without_an_applicant_email(): void
    {
        $this->signIn();
        Mail::fake();
        $adoption = $this->adoption(email: '');

        $this->postJson("/internal/adoptions/{$adoption->id}/decline", ['internal_reason' => 'Intern'])->assertOk();

        $this->assertSame('canceled', $adoption->fresh()->status);
        Mail::assertNothingSent();
    }

    public function test_decline_stays_pending_when_the_mail_cannot_be_sent(): void
    {
        $this->signIn();
        $this->withoutExceptionHandling();
        Mail::shouldReceive('to')->andThrow(new \RuntimeException('SMTP down'));
        $adoption = $this->adoption();

        try {
            $this->postJson("/internal/adoptions/{$adoption->id}/decline", ['internal_reason' => 'Intern']);
            $this->fail('Expected the mail failure to surface.');
        } catch (\RuntimeException $e) {
            $this->assertSame('SMTP down', $e->getMessage());
        }

        $fresh = $adoption->fresh();
        $this->assertSame('pending', $fresh->status);
        $this->assertNull($fresh->canceled_reason);
        $this->assertNull($fresh->canceled_at);
    }

    public function test_authentication_is_required(): void
    {
        $adoption = $this->adoption();

        $this->postJson("/internal/adoptions/{$adoption->id}/accept")->assertUnauthorized();
        $this->postJson("/internal/adoptions/{$adoption->id}/decline", ['internal_reason' => 'x'])->assertUnauthorized();
    }
}
