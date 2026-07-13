<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Testing\TestResponse;
use Taily\Models\User;
use Taily\Tests\TestCase;

class SessionControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Same stateful-SPA referer the other security tests rely on so the
        // session middleware is exercised as it is in production, plus the
        // database session driver so rows actually land in the `sessions`
        // table (phpunit.xml otherwise sets the `array` driver for speed).
        $this->withHeader('referer', 'http://taily.ddev.site:5544');
        // JSON test requests don't send cookies unless credentials are
        // explicitly enabled, but the session cookie is exactly what carries
        // "the current device" between the requests each test makes.
        $this->withCredentials();
        config(['session.driver' => 'database']);
    }

    private function createUser(): User
    {
        return User::factory()->create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => Hash::make('CorrectPassword1'),
        ]);
    }

    private function actingAsConfirmed(User $user): void
    {
        $this->actingAs($user);
        $response = $this->postJson('/internal/user/confirm-password', [
            'password' => 'CorrectPassword1',
        ])->assertSuccessful();

        $this->carrySessionCookie($response);
    }

    /**
     * The test client does not carry cookies between requests on its own, so
     * without this every call would start a brand new session row. Pinning
     * the session cookie from a response keeps "the current device" stable
     * across the multiple requests a single test makes.
     */
    private function carrySessionCookie(TestResponse $response): void
    {
        $sessionCookieName = config('session.cookie');

        foreach ($response->headers->getCookies() as $cookie) {
            if ($cookie->getName() === $sessionCookieName) {
                $this->withUnencryptedCookie($cookie->getName(), $cookie->getValue());

                return;
            }
        }
    }

    private function insertFakeSession(User $user, string $id, string $userAgent, ?string $ip = '203.0.113.5'): void
    {
        DB::table('sessions')->insert([
            'id' => $id,
            'user_id' => $user->id,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'payload' => base64_encode(serialize([])),
            'last_activity' => now()->timestamp,
        ]);
    }

    public function test_user_can_list_active_sessions_with_current_device_flagged(): void
    {
        $user = $this->createUser();
        $this->actingAsConfirmed($user);

        $this->insertFakeSession(
            $user,
            'other-session-id',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0 Safari/537.36'
        );

        $data = $this->getJson('/internal/user/sessions')
            ->assertOk()
            ->json('data');

        $this->assertCount(2, $data);

        $current = collect($data)->firstWhere('is_current_device', true);
        $other = collect($data)->firstWhere('is_current_device', false);

        $this->assertNotNull($current);
        $this->assertNotNull($other);
        $this->assertSame('Chrome', $other['browser']);
        $this->assertSame('Windows', $other['platform']);
        $this->assertSame('203.0.113.5', $other['ip_address']);
    }

    public function test_user_can_sign_out_a_specific_session(): void
    {
        $user = $this->createUser();
        $this->actingAsConfirmed($user);

        $this->insertFakeSession($user, 'other-session-id', 'Mozilla/5.0 Firefox/120.0');

        $hashedId = hash('sha256', 'other-session-id');

        $this->deleteJson("/internal/user/sessions/{$hashedId}")->assertSuccessful();

        $this->assertDatabaseMissing('sessions', ['id' => 'other-session-id']);
    }

    public function test_user_cannot_sign_out_another_users_session(): void
    {
        $user = $this->createUser();
        $otherUser = User::factory()->create(['name' => 'John Smith', 'email' => 'other@example.com']);

        $this->insertFakeSession($otherUser, 'someone-elses-session', 'Mozilla/5.0 Firefox/120.0');

        $this->actingAsConfirmed($user);

        $hashedId = hash('sha256', 'someone-elses-session');

        $this->deleteJson("/internal/user/sessions/{$hashedId}")->assertStatus(404);

        $this->assertDatabaseHas('sessions', ['id' => 'someone-elses-session']);
    }

    public function test_user_cannot_sign_out_their_own_current_session_via_the_single_delete_endpoint(): void
    {
        $user = $this->createUser();
        $this->actingAsConfirmed($user);

        $currentSessionId = DB::table('sessions')->where('user_id', $user->id)->value('id');
        $hashedId = hash('sha256', $currentSessionId);

        $this->deleteJson("/internal/user/sessions/{$hashedId}")->assertStatus(404);
    }

    public function test_user_can_sign_out_of_all_other_sessions(): void
    {
        $user = $this->createUser();
        $this->actingAsConfirmed($user);

        $currentSessionId = DB::table('sessions')->where('user_id', $user->id)->value('id');

        $this->insertFakeSession($user, 'other-session-a', 'Mozilla/5.0 Firefox/120.0');
        $this->insertFakeSession($user, 'other-session-b', 'Mozilla/5.0 Chrome/120.0');

        $this->deleteJson('/internal/user/sessions')->assertSuccessful();

        $remaining = DB::table('sessions')->where('user_id', $user->id)->pluck('id');

        $this->assertEquals([$currentSessionId], $remaining->all());
    }

    public function test_session_management_endpoints_require_a_fresh_password_confirmation(): void
    {
        $user = $this->createUser();
        $this->actingAs($user);

        $this->insertFakeSession($user, 'other-session-id', 'Mozilla/5.0 Firefox/120.0');
        $hashedId = hash('sha256', 'other-session-id');

        $this->deleteJson("/internal/user/sessions/{$hashedId}")->assertStatus(423);
        $this->deleteJson('/internal/user/sessions')->assertStatus(423);

        // Listing does not require a fresh confirmation.
        $this->getJson('/internal/user/sessions')->assertOk();
    }
}
