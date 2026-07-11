<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Taily\Models\User;
use Taily\Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_fetch_their_profile(): void
    {
        $user = User::factory()->create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => Hash::make('OldPassword1'),
        ]);

        // A Referer matching config('sanctum.stateful') makes Sanctum treat the request
        // as coming from the SPA, pulling the session/cookie middleware (auth.session
        // included) into the pipeline — this is what previously threw a
        // "Method Illuminate\Auth\RequestGuard::viaRemember does not exist" 500, since
        // Laravel's stock auth.session middleware isn't compatible with Sanctum's guard.
        $response = $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->getJson('/internal/profile');

        $response->assertOk();
        $response->assertJsonPath('email', 'jane@example.com');
    }
}
