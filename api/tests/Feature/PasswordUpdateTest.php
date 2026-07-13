<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Taily\Models\User;
use Taily\Tests\TestCase;

class PasswordUpdateTest extends TestCase
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

    private function createUser(string $password): User
    {
        return User::factory()->create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => Hash::make($password),
        ]);
    }

    public function test_user_can_change_password_with_correct_current_password(): void
    {
        $user = $this->createUser('OldPassword1');

        $response = $this->actingAs($user)->putJson('/internal/profile/password', [
            'current_password' => 'OldPassword1',
            'password' => 'NewPassword2',
            'password_confirmation' => 'NewPassword2',
        ]);

        $response->assertOk();
        $this->assertTrue(Hash::check('NewPassword2', $user->fresh()->password));
        $this->assertAuthenticatedAs($user);
    }

    public function test_change_password_fails_with_wrong_current_password(): void
    {
        $user = $this->createUser('OldPassword1');

        $response = $this->actingAs($user)->putJson('/internal/profile/password', [
            'current_password' => 'WrongPassword1',
            'password' => 'NewPassword2',
            'password_confirmation' => 'NewPassword2',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('current_password');
        $this->assertTrue(Hash::check('OldPassword1', $user->fresh()->password));
    }

    public function test_change_password_fails_with_weak_password(): void
    {
        $user = $this->createUser('OldPassword1');

        $response = $this->actingAs($user)->putJson('/internal/profile/password', [
            'current_password' => 'OldPassword1',
            'password' => 'short',
            'password_confirmation' => 'short',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('password');
        $this->assertTrue(Hash::check('OldPassword1', $user->fresh()->password));
    }

    public function test_change_password_fails_with_mismatched_confirmation(): void
    {
        $user = $this->createUser('OldPassword1');

        $response = $this->actingAs($user)->putJson('/internal/profile/password', [
            'current_password' => 'OldPassword1',
            'password' => 'NewPassword2',
            'password_confirmation' => 'SomethingElse3',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('password');
        $this->assertTrue(Hash::check('OldPassword1', $user->fresh()->password));
    }

    public function test_password_change_rotates_the_remember_token(): void
    {
        $user = $this->createUser('OldPassword1');
        $user->setRememberToken('stale-remember-token');
        $user->save();

        $this->actingAs($user)->putJson('/internal/profile/password', [
            'current_password' => 'OldPassword1',
            'password' => 'NewPassword2',
            'password_confirmation' => 'NewPassword2',
        ])->assertOk();

        // logoutOtherDevices() only evicts other sessions; "stay logged in"
        // cookies keep working unless the remember token is rotated with the
        // password.
        $this->assertNotSame('stale-remember-token', $user->fresh()->remember_token);
        $this->assertNotNull($user->fresh()->remember_token);
    }

    public function test_change_password_requires_authentication(): void
    {
        $response = $this->putJson('/internal/profile/password', [
            'current_password' => 'OldPassword1',
            'password' => 'NewPassword2',
            'password_confirmation' => 'NewPassword2',
        ]);

        $response->assertUnauthorized();
    }

    // actingAs() short-circuits the real login flow, so it never exercises the
    // session-hash-invalidation middleware on a first request (the hash isn't
    // cached in the session yet). Logging in for real and priming the session
    // with a prior request is what reproduces the self-logout regression.
    public function test_current_session_stays_authenticated_after_successful_password_change(): void
    {
        $this->createUser('OldPassword1');

        $this->postJson('/internal/login', [
            'email' => 'jane@example.com',
            'password' => 'OldPassword1',
        ])->assertOk();
        $this->getJson('/internal/user')->assertOk();

        $this->putJson('/internal/profile/password', [
            'current_password' => 'OldPassword1',
            'password' => 'NewPassword2',
            'password_confirmation' => 'NewPassword2',
        ])->assertOk();

        $this->getJson('/internal/user')->assertOk();
    }

    public function test_current_session_stays_authenticated_after_failed_password_change(): void
    {
        $this->createUser('OldPassword1');

        $this->postJson('/internal/login', [
            'email' => 'jane@example.com',
            'password' => 'OldPassword1',
        ])->assertOk();
        $this->getJson('/internal/user')->assertOk();

        $this->putJson('/internal/profile/password', [
            'current_password' => 'WrongPassword1',
            'password' => 'NewPassword2',
            'password_confirmation' => 'NewPassword2',
        ])->assertUnprocessable();

        $this->getJson('/internal/user')->assertOk();
    }
}
