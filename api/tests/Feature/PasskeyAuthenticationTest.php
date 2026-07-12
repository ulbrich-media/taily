<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Passkeys\Passkey;
use Taily\Models\User;
use Taily\Tests\TestCase;

class PasskeyAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Same stateful-SPA referer the authentication tests rely on so the
        // session middleware is exercised as it is in production.
        $this->withHeader('referer', 'http://taily.ddev.site:5544');
    }

    private function createUser(string $email = 'jane@example.com'): User
    {
        return User::factory()->create([
            'name' => 'Jane Doe',
            'email' => $email,
            'password' => Hash::make('CorrectPassword1'),
        ]);
    }

    private function actingAsConfirmed(User $user): void
    {
        $this->actingAs($user);
        $this->postJson('/internal/user/confirm-password', [
            'password' => 'CorrectPassword1',
        ])->assertSuccessful();
    }

    private function createPasskeyFor(User $user): Passkey
    {
        return $user->passkeys()->create([
            'name' => 'MacBook Pro',
            'credential_id' => base64_encode(random_bytes(16)),
            'credential' => ['type' => 'fake'],
        ]);
    }

    public function test_registration_options_require_authentication(): void
    {
        $this->getJson('/internal/user/passkeys/options')->assertUnauthorized();
    }

    public function test_registration_options_require_a_confirmed_password(): void
    {
        $user = $this->createUser();
        $this->actingAs($user);

        $this->getJson('/internal/user/passkeys/options')->assertStatus(423);
        $this->postJson('/internal/user/passkeys', ['name' => 'YubiKey'])->assertStatus(423);
    }

    public function test_registration_options_are_scoped_to_the_configured_relying_party(): void
    {
        $user = $this->createUser();
        $this->actingAsConfirmed($user);

        $options = $this->getJson('/internal/user/passkeys/options')
            ->assertOk()
            ->assertJsonStructure(['options' => ['challenge', 'rp', 'user', 'pubKeyCredParams']])
            ->json('options');

        $this->assertSame('taily.ddev.site', $options['rp']['id']);
        $this->assertSame($user->email, $options['user']['name']);
    }

    public function test_login_options_do_not_require_authentication(): void
    {
        $this->getJson('/internal/passkeys/login/options')
            ->assertOk()
            ->assertJsonStructure(['options' => ['challenge']]);
    }

    public function test_user_can_list_their_own_passkeys(): void
    {
        $user = $this->createUser();
        $other = $this->createUser('other@example.com');

        $this->createPasskeyFor($user);
        $this->createPasskeyFor($other);

        $this->actingAs($user);

        $response = $this->getJson('/internal/user/passkeys')->assertOk()->json('data');

        $this->assertCount(1, $response);
        $this->assertSame('MacBook Pro', $response[0]['name']);
    }

    public function test_listing_requires_authentication(): void
    {
        $this->getJson('/internal/user/passkeys')->assertUnauthorized();
    }

    public function test_user_can_delete_their_own_passkey(): void
    {
        $user = $this->createUser();
        $passkey = $this->createPasskeyFor($user);

        $this->actingAsConfirmed($user);

        $this->deleteJson("/internal/user/passkeys/{$passkey->id}")->assertSuccessful();

        $this->assertDatabaseMissing('passkeys', ['id' => $passkey->id]);
    }

    public function test_user_cannot_delete_another_users_passkey(): void
    {
        $user = $this->createUser();
        $other = $this->createUser('other@example.com');
        $passkey = $this->createPasskeyFor($other);

        $this->actingAsConfirmed($user);

        $this->deleteJson("/internal/user/passkeys/{$passkey->id}")->assertForbidden();

        $this->assertDatabaseHas('passkeys', ['id' => $passkey->id]);
    }

    public function test_deleting_a_passkey_requires_a_confirmed_password(): void
    {
        $user = $this->createUser();
        $passkey = $this->createPasskeyFor($user);

        $this->actingAs($user);

        $this->deleteJson("/internal/user/passkeys/{$passkey->id}")->assertStatus(423);
    }
}
