<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Taily\Enums\UserRole;
use Taily\Mail\UserInvitationMail;
use Taily\Models\User;
use Taily\Models\UserInvitation;
use Taily\Tests\TestCase;

class UserResendInvitationTest extends TestCase
{
    use RefreshDatabase;

    private int $counter = 0;

    private function makeUser(UserRole $role = UserRole::USER, bool $loggedIn = false): User
    {
        $this->counter++;

        $user = User::factory()->create([
            'name' => "User {$this->counter}",
            'email' => "user{$this->counter}@example.com",
            'role' => $role,
        ]);
        $user->forceFill(['last_login_at' => $loggedIn ? now() : null])->save();

        return $user;
    }

    private function resend(User $actor, User $target)
    {
        return $this->actingAs($actor)
            ->withHeader('referer', 'http://localhost')
            ->postJson("/internal/users/{$target->id}/resend-invitation");
    }

    public function test_admin_can_resend_invitation_with_still_valid_invite(): void
    {
        Mail::fake();
        $user = $this->makeUser();
        $old = UserInvitation::createForUser($user);

        $this->resend($this->makeUser(UserRole::ADMIN), $user)->assertOk();

        $this->assertNull(UserInvitation::findByToken($old->plainTextToken));
        $this->assertSame(1, UserInvitation::where('user_id', $user->id)->count());
        Mail::assertSent(UserInvitationMail::class, fn ($mail) => $mail->hasTo($user->email));
    }

    public function test_admin_can_resend_invitation_with_expired_invite(): void
    {
        Mail::fake();
        $user = $this->makeUser();
        $old = UserInvitation::createForUser($user);
        $old->update(['expires_at' => now()->subDay()]);

        $this->resend($this->makeUser(UserRole::ADMIN), $user)->assertOk();

        $invitation = UserInvitation::where('user_id', $user->id)->first();
        $this->assertFalse($invitation->isExpired());
        Mail::assertSent(UserInvitationMail::class, 1);
    }

    public function test_users_who_have_logged_in_cannot_be_reinvited(): void
    {
        Mail::fake();
        $user = $this->makeUser(loggedIn: true);

        $this->resend($this->makeUser(UserRole::ADMIN), $user)->assertStatus(422);

        Mail::assertNothingSent();
    }

    public function test_non_admins_cannot_resend_invitations(): void
    {
        Mail::fake();
        $member = $this->makeUser();
        $user = $this->makeUser();

        $this->resend($member, $user)->assertForbidden();

        Mail::assertNothingSent();
    }
}
