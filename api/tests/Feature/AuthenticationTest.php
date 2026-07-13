<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Taily\Models\User;
use Taily\Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

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
            'password' => Hash::make('CorrectPassword1'),
        ]);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = $this->createUser();

        $response = $this->postJson('/internal/login', [
            'email' => 'jane@example.com',
            'password' => 'CorrectPassword1',
        ]);

        $response->assertOk();
        $this->assertAuthenticatedAs($user);
    }

    public function test_login_updates_last_login_timestamp(): void
    {
        $user = $this->createUser();
        $this->assertNull($user->last_login_at);

        $this->postJson('/internal/login', [
            'email' => 'jane@example.com',
            'password' => 'CorrectPassword1',
        ])->assertOk();

        $this->assertNotNull($user->fresh()->last_login_at);
    }

    public function test_login_fails_with_invalid_password(): void
    {
        $this->createUser();

        $response = $this->postJson('/internal/login', [
            'email' => 'jane@example.com',
            'password' => 'WrongPassword1',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('email');
        $this->assertGuest();
    }

    public function test_login_fails_with_unknown_email(): void
    {
        $response = $this->postJson('/internal/login', [
            'email' => 'nobody@example.com',
            'password' => 'CorrectPassword1',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('email');
        $this->assertGuest();
    }

    public function test_login_is_rate_limited_after_five_failed_attempts(): void
    {
        $this->createUser();

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/internal/login', [
                'email' => 'jane@example.com',
                'password' => 'WrongPassword1',
            ])->assertUnprocessable();
        }

        // The sixth attempt is locked out even with the correct password.
        // Fortify's LockoutResponse answers 429 (the old Breeze-derived code
        // used 422); the error still arrives on the email field.
        $response = $this->postJson('/internal/login', [
            'email' => 'jane@example.com',
            'password' => 'CorrectPassword1',
        ]);

        $response->assertStatus(429);
        $response->assertJsonValidationErrors('email');
        $this->assertGuest();
    }

    public function test_user_can_logout(): void
    {
        $this->createUser();

        $this->postJson('/internal/login', [
            'email' => 'jane@example.com',
            'password' => 'CorrectPassword1',
        ])->assertOk();

        $this->postJson('/internal/logout')->assertNoContent();

        $this->assertGuest('web');
    }

    public function test_logout_requires_authentication(): void
    {
        $this->postJson('/internal/logout')->assertUnauthorized();
    }
}
