<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Taily\Mail\PasswordResetMail;
use Taily\Mail\SecurityNotificationMail;
use Taily\Models\User;
use Taily\Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Password::defaults()'s uncompromised() check calls the HaveIBeenPwned range
        // API; fake it so tests are deterministic and don't depend on the network.
        Http::fake([
            'api.pwnedpasswords.com/*' => Http::response('', 200),
        ]);

        // A Referer matching config('sanctum.stateful') makes Sanctum treat the
        // request as coming from the SPA, which is what actually pulls the session/
        // cookie middleware into the pipeline in production. SANCTUM_STATEFUL_DOMAINS
        // is taily.ddev.site:5544 (see .env), so that's the only referer that triggers it.
        $this->withHeader('referer', 'http://taily.ddev.site:5544');
    }

    private function createUser(): User
    {
        return User::factory()->create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => Hash::make('OldPassword1'),
        ]);
    }

    /**
     * Request a reset link for the given user and return the plaintext token
     * captured from the outgoing mail.
     */
    private function requestResetToken(User $user): string
    {
        Mail::fake();

        $this->postJson('/internal/forgot-password', [
            'email' => $user->email,
        ])->assertOk();

        $token = null;
        Mail::assertSent(PasswordResetMail::class, function (PasswordResetMail $mail) use (&$token, $user) {
            $token = $mail->token;

            return $mail->hasTo($user->email);
        });

        $this->assertNotNull($token);

        return $token;
    }

    public function test_reset_link_can_be_requested(): void
    {
        Mail::fake();

        $this->createUser();

        $this->postJson('/internal/forgot-password', [
            'email' => 'jane@example.com',
        ])->assertOk();

        Mail::assertSent(PasswordResetMail::class, fn (PasswordResetMail $mail) => $mail->hasTo('jane@example.com'));
    }

    public function test_reset_mail_links_to_the_frontend_reset_page(): void
    {
        config(['taily.frontend_url' => 'https://app.example.org']);

        $user = $this->createUser();
        $token = $this->requestResetToken($user);

        $html = (new PasswordResetMail($user, $token))->render();

        $this->assertStringContainsString(
            'https://app.example.org/callback?action=password_reset&amp;token='.$token.'&amp;email=jane%40example.com',
            $html
        );
    }

    public function test_reset_link_request_does_not_reveal_whether_the_email_exists(): void
    {
        Mail::fake();

        $this->createUser();

        // Known and unknown emails must be indistinguishable to the caller.
        $knownResponse = $this->postJson('/internal/forgot-password', [
            'email' => 'jane@example.com',
        ]);
        $unknownResponse = $this->postJson('/internal/forgot-password', [
            'email' => 'nobody@example.com',
        ]);

        $knownResponse->assertOk();
        $unknownResponse->assertOk();
        $this->assertSame($knownResponse->json(), $unknownResponse->json());

        Mail::assertSent(PasswordResetMail::class, 1);
    }

    public function test_reset_link_requests_are_throttled_without_revealing_it(): void
    {
        Mail::fake();

        $this->createUser();

        $this->postJson('/internal/forgot-password', [
            'email' => 'jane@example.com',
        ])->assertOk();

        // auth.passwords.users.throttle blocks a second mail within 60 seconds,
        // but the response stays the generic one (a throttle error would reveal
        // that the email belongs to an account).
        $this->postJson('/internal/forgot-password', [
            'email' => 'jane@example.com',
        ])->assertOk();

        Mail::assertSent(PasswordResetMail::class, 1);
    }

    public function test_reset_link_requests_are_rate_limited_per_ip(): void
    {
        Mail::fake();

        // The route allows 6 requests per minute per IP; the broker's own
        // per-email throttle keeps answering 200, so spraying stops at the
        // route limit.
        for ($attempt = 0; $attempt < 6; $attempt++) {
            $this->postJson('/internal/forgot-password', [
                'email' => "probe{$attempt}@example.com",
            ])->assertOk();
        }

        $this->postJson('/internal/forgot-password', [
            'email' => 'probe6@example.com',
        ])->assertStatus(429);
    }

    public function test_password_can_be_reset_with_valid_token(): void
    {
        $user = $this->createUser();
        $token = $this->requestResetToken($user);

        Mail::fake();

        $response = $this->postJson('/internal/reset-password', [
            'token' => $token,
            'email' => 'jane@example.com',
            'password' => 'NewPassword2',
            'password_confirmation' => 'NewPassword2',
        ]);

        $response->assertOk();
        $this->assertTrue(Hash::check('NewPassword2', $user->fresh()->password));

        Mail::assertSent(SecurityNotificationMail::class, fn (SecurityNotificationMail $mail) => $mail->hasTo($user->email));
        Mail::assertSent(SecurityNotificationMail::class, 1);

        // The new credentials work for login.
        $this->postJson('/internal/login', [
            'email' => 'jane@example.com',
            'password' => 'NewPassword2',
        ])->assertOk();
    }

    public function test_password_reset_fails_with_invalid_token(): void
    {
        $user = $this->createUser();
        $this->requestResetToken($user);

        $response = $this->postJson('/internal/reset-password', [
            'token' => 'invalid-token',
            'email' => 'jane@example.com',
            'password' => 'NewPassword2',
            'password_confirmation' => 'NewPassword2',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('email');
        $this->assertTrue(Hash::check('OldPassword1', $user->fresh()->password));

        Mail::assertNotSent(SecurityNotificationMail::class);
    }

    public function test_failed_reset_does_not_reveal_whether_the_email_exists(): void
    {
        $this->createUser();

        // An unknown email must produce the same error as a bad token for a
        // known email, so the endpoint cannot be used for email enumeration.
        $knownResponse = $this->postJson('/internal/reset-password', [
            'token' => 'invalid-token',
            'email' => 'jane@example.com',
            'password' => 'NewPassword2',
            'password_confirmation' => 'NewPassword2',
        ]);
        $unknownResponse = $this->postJson('/internal/reset-password', [
            'token' => 'invalid-token',
            'email' => 'nobody@example.com',
            'password' => 'NewPassword2',
            'password_confirmation' => 'NewPassword2',
        ]);

        $knownResponse->assertUnprocessable();
        $unknownResponse->assertUnprocessable();
        $this->assertSame($knownResponse->json(), $unknownResponse->json());
    }

    public function test_password_reset_fails_with_weak_password(): void
    {
        $user = $this->createUser();
        $token = $this->requestResetToken($user);

        $response = $this->postJson('/internal/reset-password', [
            'token' => $token,
            'email' => 'jane@example.com',
            'password' => 'short',
            'password_confirmation' => 'short',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('password');
        $this->assertTrue(Hash::check('OldPassword1', $user->fresh()->password));
    }

    public function test_token_cannot_be_reused_after_successful_reset(): void
    {
        $user = $this->createUser();
        $token = $this->requestResetToken($user);

        $this->postJson('/internal/reset-password', [
            'token' => $token,
            'email' => 'jane@example.com',
            'password' => 'NewPassword2',
            'password_confirmation' => 'NewPassword2',
        ])->assertOk();

        $this->postJson('/internal/reset-password', [
            'token' => $token,
            'email' => 'jane@example.com',
            'password' => 'AnotherPassword3',
            'password_confirmation' => 'AnotherPassword3',
        ])->assertUnprocessable();

        $this->assertTrue(Hash::check('NewPassword2', $user->fresh()->password));
    }
}
