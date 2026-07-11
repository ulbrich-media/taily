<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Fortify\Fortify;
use PragmaRX\Google2FA\Google2FA;
use Taily\Models\User;
use Taily\Tests\TestCase;

class TwoFactorAuthenticationTest extends TestCase
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
     * Enable and confirm two-factor for the given (already authenticated) user
     * and return the decrypted TOTP secret.
     */
    private function enableAndConfirmTwoFactor(): string
    {
        $this->postJson('/internal/user/two-factor-authentication')->assertSuccessful();

        $secret = $this->getJson('/internal/user/two-factor-secret-key')
            ->assertOk()
            ->json('secretKey');

        $this->postJson('/internal/user/confirmed-two-factor-authentication', [
            'code' => $this->currentOtp($secret),
        ])->assertSuccessful();

        return $secret;
    }

    private function currentOtp(string $secret): string
    {
        return app(Google2FA::class)->getCurrentOtp($secret);
    }

    /**
     * Provision a fully-confirmed second factor directly on the model, without
     * authenticating. Login-flow assertions need to start from a clean guard,
     * which acting as the user during HTTP setup would pollute. Returns the
     * plain secret and the plain recovery codes.
     *
     * @return array{secret: string, recoveryCodes: list<string>}
     */
    private function provisionConfirmedTwoFactor(User $user): array
    {
        $secret = app(Google2FA::class)->generateSecretKey();
        $recoveryCodes = ['recovery-code-aaa', 'recovery-code-bbb', 'recovery-code-ccc'];

        $user->forceFill([
            'two_factor_secret' => Fortify::currentEncrypter()->encrypt($secret),
            'two_factor_recovery_codes' => Fortify::currentEncrypter()->encrypt(json_encode($recoveryCodes)),
            'two_factor_confirmed_at' => now(),
        ])->save();

        return ['secret' => $secret, 'recoveryCodes' => $recoveryCodes];
    }

    public function test_enabling_two_factor_exposes_qr_secret_and_recovery_codes(): void
    {
        $user = $this->createUser();
        $this->actingAs($user);

        $this->postJson('/internal/user/two-factor-authentication')->assertSuccessful();

        $this->getJson('/internal/user/two-factor-qr-code')
            ->assertOk()
            ->assertJsonStructure(['svg', 'url']);

        $this->getJson('/internal/user/two-factor-secret-key')
            ->assertOk()
            ->assertJsonStructure(['secretKey']);

        $recoveryCodes = $this->getJson('/internal/user/two-factor-recovery-codes')
            ->assertOk()
            ->json();

        $this->assertcount(8, $recoveryCodes);

        // With the `confirm` option on, the secret exists but the second factor
        // is not active until a code is confirmed.
        $this->assertNull($user->fresh()->two_factor_confirmed_at);
    }

    public function test_user_can_confirm_two_factor_with_a_valid_code(): void
    {
        $user = $this->createUser();
        $this->actingAs($user);

        $this->enableAndConfirmTwoFactor();

        $this->assertNotNull($user->fresh()->two_factor_confirmed_at);
    }

    public function test_confirmation_fails_with_an_invalid_code(): void
    {
        $user = $this->createUser();
        $this->actingAs($user);

        $this->postJson('/internal/user/two-factor-authentication')->assertSuccessful();

        $this->postJson('/internal/user/confirmed-two-factor-authentication', [
            'code' => '000000',
        ])->assertStatus(422);

        $this->assertNull($user->fresh()->two_factor_confirmed_at);
    }

    public function test_recovery_codes_can_be_regenerated(): void
    {
        $user = $this->createUser();
        $this->actingAs($user);

        $this->enableAndConfirmTwoFactor();

        $before = $this->getJson('/internal/user/two-factor-recovery-codes')->json();

        $this->postJson('/internal/user/two-factor-recovery-codes')->assertSuccessful();

        $after = $this->getJson('/internal/user/two-factor-recovery-codes')->json();

        $this->assertCount(8, $after);
        $this->assertNotEquals($before, $after);
    }

    public function test_user_can_disable_two_factor(): void
    {
        $user = $this->createUser();
        $this->actingAs($user);

        $this->enableAndConfirmTwoFactor();

        $this->deleteJson('/internal/user/two-factor-authentication')->assertSuccessful();

        $fresh = $user->fresh();
        $this->assertNull($fresh->two_factor_secret);
        $this->assertNull($fresh->two_factor_confirmed_at);
    }

    public function test_management_endpoints_require_authentication(): void
    {
        $this->postJson('/internal/user/two-factor-authentication')->assertUnauthorized();
        $this->deleteJson('/internal/user/two-factor-authentication')->assertUnauthorized();
        $this->postJson('/internal/user/confirmed-two-factor-authentication')->assertUnauthorized();
        $this->getJson('/internal/user/two-factor-qr-code')->assertUnauthorized();
        $this->getJson('/internal/user/two-factor-secret-key')->assertUnauthorized();
        $this->getJson('/internal/user/two-factor-recovery-codes')->assertUnauthorized();
        $this->postJson('/internal/user/two-factor-recovery-codes')->assertUnauthorized();
    }

    public function test_profile_reports_two_factor_state(): void
    {
        $user = $this->createUser();
        $this->actingAs($user);

        $this->getJson('/internal/profile')
            ->assertOk()
            ->assertJson(['two_factor_enabled' => false]);

        $this->enableAndConfirmTwoFactor();

        $this->getJson('/internal/profile')
            ->assertOk()
            ->assertJson(['two_factor_enabled' => true]);
    }

    public function test_profile_never_exposes_the_two_factor_secret(): void
    {
        $user = $this->createUser();
        $this->actingAs($user);
        $this->enableAndConfirmTwoFactor();

        $this->getJson('/internal/profile')
            ->assertOk()
            ->assertJsonMissing(['two_factor_secret' => null])
            ->assertJsonMissingPath('two_factor_secret')
            ->assertJsonMissingPath('two_factor_recovery_codes');
    }

    public function test_login_demands_second_factor_when_enabled(): void
    {
        $user = $this->createUser();
        ['secret' => $secret] = $this->provisionConfirmedTwoFactor($user);

        // Credentials alone no longer authenticate; login stalls on 2FA.
        $this->postJson('/internal/login', [
            'email' => 'jane@example.com',
            'password' => 'CorrectPassword1',
        ])->assertOk()->assertJson(['two_factor' => true]);

        $this->assertGuest();

        // Completing the challenge with a valid TOTP logs the user in.
        $this->postJson('/internal/two-factor-challenge', [
            'code' => $this->currentOtp($secret),
        ])->assertSuccessful();

        $this->assertAuthenticatedAs($user);
    }

    public function test_two_factor_challenge_accepts_a_recovery_code(): void
    {
        $user = $this->createUser();
        ['recoveryCodes' => $recoveryCodes] = $this->provisionConfirmedTwoFactor($user);

        $this->postJson('/internal/login', [
            'email' => 'jane@example.com',
            'password' => 'CorrectPassword1',
        ])->assertOk()->assertJson(['two_factor' => true]);

        $this->postJson('/internal/two-factor-challenge', [
            'recovery_code' => $recoveryCodes[0],
        ])->assertSuccessful();

        $this->assertAuthenticatedAs($user);
    }

    public function test_a_recovery_code_cannot_be_reused(): void
    {
        $user = $this->createUser();
        ['recoveryCodes' => $recoveryCodes] = $this->provisionConfirmedTwoFactor($user);

        // First use succeeds and consumes the code.
        $this->postJson('/internal/login', [
            'email' => 'jane@example.com',
            'password' => 'CorrectPassword1',
        ])->assertOk()->assertJson(['two_factor' => true]);
        $this->postJson('/internal/two-factor-challenge', [
            'recovery_code' => $recoveryCodes[0],
        ])->assertSuccessful();
        $this->postJson('/internal/logout')->assertNoContent();

        // Second use of the same code is rejected. (A prior successful login in
        // this test leaves the guard resolved, so the 422 — not assertGuest — is
        // the reliable proof that the consumed code no longer authenticates.)
        $this->postJson('/internal/login', [
            'email' => 'jane@example.com',
            'password' => 'CorrectPassword1',
        ])->assertOk()->assertJson(['two_factor' => true]);
        $this->postJson('/internal/two-factor-challenge', [
            'recovery_code' => $recoveryCodes[0],
        ])->assertStatus(422);
    }

    public function test_two_factor_challenge_rejects_an_invalid_code(): void
    {
        $user = $this->createUser();
        $this->provisionConfirmedTwoFactor($user);

        $this->postJson('/internal/login', [
            'email' => 'jane@example.com',
            'password' => 'CorrectPassword1',
        ])->assertOk()->assertJson(['two_factor' => true]);

        $this->postJson('/internal/two-factor-challenge', [
            'code' => '000000',
        ])->assertStatus(422);

        $this->assertGuest();
    }
}
