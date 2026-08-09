<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Passkeys\Passkey;
use Laravel\Passkeys\Passkeys;
use Taily\Models\User;
use Taily\Providers\FortifyServiceProvider;
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

    public function test_passkey_resolves_its_owning_user(): void
    {
        // laravel/passkeys resolves the owning user through a configurable
        // model class that defaults to App\Models\User, which doesn't exist
        // in Taily. Without Passkeys::useUserModel() pointing it at
        // Taily\Models\User, this relation throws
        // "Class App\Models\User not found" — exactly what VerifyPasskey
        // hits when completing a real login.
        $user = $this->createUser();
        $passkey = $this->createPasskeyFor($user);

        $this->assertTrue($passkey->user->is($user));
    }

    public function test_fortify_service_provider_configures_the_passkeys_user_model(): void
    {
        // Laravel Fortify's own provider also tries to configure the
        // passkeys user model, by reading config('auth.providers.users.model')
        // — but it boots (as a package-discovered provider) before
        // TailyServiceProvider ever sets that config key at runtime, so it
        // reads null and silently skips the call. A host app that ships its
        // own config/auth.php with the model pre-declared (like this
        // package's dev app) never notices, because the value is already
        // present before any provider boots. But the taily-app distribution
        // scaffold ships no config/auth.php at all, so nothing ever sets it
        // in time — leaving laravel/passkeys' broken hardcoded default
        // (App\Models\User) in place and crashing every real passkey login.
        // Taily's own FortifyServiceProvider must therefore set the model
        // unconditionally and directly, independent of that config race.
        Passkeys::useUserModel('App\\Models\\User');

        (new FortifyServiceProvider($this->app))->boot();

        $this->assertSame(User::class, Passkeys::userModel());
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
