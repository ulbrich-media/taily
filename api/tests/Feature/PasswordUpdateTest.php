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

    public function test_change_password_requires_authentication(): void
    {
        $response = $this->putJson('/internal/profile/password', [
            'current_password' => 'OldPassword1',
            'password' => 'NewPassword2',
            'password_confirmation' => 'NewPassword2',
        ]);

        $response->assertUnauthorized();
    }
}
