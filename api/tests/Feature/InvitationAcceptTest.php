<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Taily\Models\User;
use Taily\Models\UserInvitation;
use Taily\Tests\TestCase;

class InvitationAcceptTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Http::fake([
            'api.pwnedpasswords.com/*' => Http::response('', 200),
        ]);
    }

    private function createInvitedUser(): User
    {
        return User::factory()->create([
            'name' => 'Invited User',
            'email' => 'invited@example.com',
            'password' => Hash::make(bin2hex(random_bytes(32))),
        ]);
    }

    public function test_user_can_accept_invitation_with_valid_password(): void
    {
        $user = $this->createInvitedUser();
        $invitation = UserInvitation::createForUser($user);

        $response = $this->postJson("/internal/invitations/{$invitation->plainTextToken}/accept", [
            'name' => 'New Name',
            'password' => 'ValidPassword1',
            'password_confirmation' => 'ValidPassword1',
        ]);

        $response->assertOk();
        $user->refresh();
        $this->assertSame('New Name', $user->name);
        $this->assertTrue(Hash::check('ValidPassword1', $user->password));
        $this->assertTrue($invitation->fresh()->isAccepted());
    }

    public function test_invitation_accept_rejects_weak_password(): void
    {
        $user = $this->createInvitedUser();
        $invitation = UserInvitation::createForUser($user);

        $response = $this->postJson("/internal/invitations/{$invitation->plainTextToken}/accept", [
            'name' => 'New Name',
            'password' => 'short',
            'password_confirmation' => 'short',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('password');
        $this->assertFalse($invitation->fresh()->isAccepted());
    }

    public function test_invitation_accept_rejects_mismatched_confirmation(): void
    {
        $user = $this->createInvitedUser();
        $invitation = UserInvitation::createForUser($user);

        $response = $this->postJson("/internal/invitations/{$invitation->plainTextToken}/accept", [
            'name' => 'New Name',
            'password' => 'ValidPassword1',
            'password_confirmation' => 'SomethingElse2',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('password');
        $this->assertFalse($invitation->fresh()->isAccepted());
    }

    public function test_invitation_accept_rejects_invalid_token(): void
    {
        $response = $this->postJson('/internal/invitations/'.Str::random(64).'/accept', [
            'name' => 'New Name',
            'password' => 'ValidPassword1',
            'password_confirmation' => 'ValidPassword1',
        ]);

        $response->assertNotFound();
    }

    public function test_invitation_tokens_are_stored_hashed(): void
    {
        $user = $this->createInvitedUser();
        $invitation = UserInvitation::createForUser($user);

        // Only the hash may be persisted: a leaked database copy must not be
        // enough to take over pending accounts.
        $this->assertNotNull($invitation->plainTextToken);
        $this->assertSame(hash('sha256', $invitation->plainTextToken), $invitation->fresh()->token);
    }

    public function test_invitation_endpoints_are_rate_limited_per_ip(): void
    {
        for ($attempt = 0; $attempt < 6; $attempt++) {
            $this->getJson('/internal/invitations/'.Str::random(64))->assertNotFound();
        }

        $this->getJson('/internal/invitations/'.Str::random(64))->assertStatus(429);
    }
}
