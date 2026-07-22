<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Taily\Mail\EmailChangeConfirmationMail;
use Taily\Mail\SecurityNotificationMail;
use Taily\Models\PendingEmailChange;
use Taily\Models\User;
use Taily\Tests\TestCase;

class EmailChangeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Same stateful-SPA referer the authentication tests rely on so the
        // session middleware is exercised as it is in production.
        $this->withHeader('referer', 'http://taily.ddev.site:5544');
    }

    private function createUser(): User
    {
        return User::factory()->create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => Hash::make('CorrectPassword1'),
        ]);
    }

    /**
     * Authenticate as the user and clear the password-confirmation gate on the
     * email-change endpoint by confirming the password once.
     */
    private function actingAsConfirmed(User $user): void
    {
        $this->actingAs($user);
        $this->postJson('/internal/user/confirm-password', [
            'password' => 'CorrectPassword1',
        ])->assertSuccessful();
    }

    /**
     * Request an email change for the given (already authenticated, confirmed)
     * user and return the plaintext token captured from the outgoing mail.
     */
    private function requestChangeToken(string $newEmail): string
    {
        Mail::fake();

        $this->postJson('/internal/profile/email', [
            'email' => $newEmail,
        ])->assertOk();

        $token = null;
        Mail::assertSent(EmailChangeConfirmationMail::class, function (EmailChangeConfirmationMail $mail) use (&$token, $newEmail) {
            $token = $mail->plainTextToken;

            return $mail->hasTo($newEmail);
        });

        $this->assertNotNull($token);

        return $token;
    }

    public function test_requesting_an_email_change_requires_password_confirmation(): void
    {
        Mail::fake();

        $user = $this->createUser();
        $this->actingAs($user);

        $this->postJson('/internal/profile/email', [
            'email' => 'new@example.com',
        ])->assertStatus(423);

        Mail::assertNotSent(EmailChangeConfirmationMail::class);
    }

    public function test_requesting_an_email_change_creates_a_pending_row_and_mails_the_new_address(): void
    {
        Mail::fake();

        $user = $this->createUser();
        $this->actingAsConfirmed($user);

        $this->postJson('/internal/profile/email', [
            'email' => 'new@example.com',
        ])->assertOk();

        $this->assertDatabaseHas('pending_email_changes', [
            'user_id' => $user->id,
            'new_email' => 'new@example.com',
        ]);

        Mail::assertSent(EmailChangeConfirmationMail::class, fn (EmailChangeConfirmationMail $mail) => $mail->hasTo('new@example.com'));
        Mail::assertSent(EmailChangeConfirmationMail::class, 1);

        // The account's email must not change yet.
        $this->assertSame('jane@example.com', $user->fresh()->email);
    }

    public function test_requested_email_must_not_already_belong_to_another_user(): void
    {
        User::factory()->create(['name' => 'John Doe', 'email' => 'taken@example.com']);

        $user = $this->createUser();
        $this->actingAsConfirmed($user);

        $response = $this->postJson('/internal/profile/email', [
            'email' => 'taken@example.com',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('email');
    }

    public function test_a_second_request_replaces_the_earlier_pending_one(): void
    {
        $user = $this->createUser();
        $this->actingAsConfirmed($user);

        $this->requestChangeToken('first@example.com');
        $this->requestChangeToken('second@example.com');

        $this->assertDatabaseCount('pending_email_changes', 1);
        $this->assertDatabaseHas('pending_email_changes', [
            'user_id' => $user->id,
            'new_email' => 'second@example.com',
        ]);
    }

    public function test_confirming_applies_the_change_and_notifies_the_old_address(): void
    {
        $user = $this->createUser();
        $this->actingAsConfirmed($user);

        $token = $this->requestChangeToken('new@example.com');

        Mail::fake();

        $response = $this->postJson("/internal/profile/email/confirm/{$token}");

        $response->assertOk();
        $this->assertSame('new@example.com', $user->fresh()->email);
        $this->assertDatabaseCount('pending_email_changes', 0);

        Mail::assertSent(SecurityNotificationMail::class, fn (SecurityNotificationMail $mail) => $mail->hasTo('jane@example.com'));
        Mail::assertSent(SecurityNotificationMail::class, 1);
    }

    public function test_confirming_does_not_require_authentication(): void
    {
        $user = $this->createUser();
        $this->actingAsConfirmed($user);
        $token = $this->requestChangeToken('new@example.com');

        // Fresh, unauthenticated request instance: the token is itself the
        // credential, the same trust model as password reset/invitation links.
        $this->app['auth']->forgetGuards();

        $this->postJson("/internal/profile/email/confirm/{$token}")->assertOk();
    }

    public function test_confirm_fails_with_invalid_token(): void
    {
        $user = $this->createUser();
        $this->actingAsConfirmed($user);
        $this->requestChangeToken('new@example.com');

        $response = $this->postJson('/internal/profile/email/confirm/invalid-token');

        $response->assertNotFound();
        $this->assertSame('jane@example.com', $user->fresh()->email);
    }

    public function test_confirm_fails_with_expired_token(): void
    {
        $user = $this->createUser();
        $this->actingAsConfirmed($user);
        $token = $this->requestChangeToken('new@example.com');

        PendingEmailChange::where('user_id', $user->id)->update([
            'expires_at' => now()->subMinute(),
        ]);

        $response = $this->postJson("/internal/profile/email/confirm/{$token}");

        $response->assertNotFound();
        $this->assertSame('jane@example.com', $user->fresh()->email);
    }

    public function test_token_cannot_be_reused_after_successful_confirmation(): void
    {
        $user = $this->createUser();
        $this->actingAsConfirmed($user);
        $token = $this->requestChangeToken('new@example.com');

        $this->postJson("/internal/profile/email/confirm/{$token}")->assertOk();
        $this->postJson("/internal/profile/email/confirm/{$token}")->assertNotFound();
    }

    public function test_user_can_cancel_a_pending_change(): void
    {
        $user = $this->createUser();
        $this->actingAsConfirmed($user);
        $this->requestChangeToken('new@example.com');

        $this->deleteJson('/internal/profile/email')->assertOk();

        $this->assertDatabaseCount('pending_email_changes', 0);
    }

    public function test_profile_endpoint_surfaces_the_pending_change(): void
    {
        $user = $this->createUser();
        $this->actingAsConfirmed($user);
        $this->requestChangeToken('new@example.com');

        $response = $this->getJson('/internal/profile');

        $response->assertOk();
        $response->assertJsonPath('pending_email.new_email', 'new@example.com');
    }
}
