<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Taily\Enums\UserRole;
use Taily\Models\User;
use Taily\Tests\TestCase;

class UserListTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_reports_two_factor_status_for_each_user(): void
    {
        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'role' => UserRole::ADMIN,
        ]);

        $withTwoFactor = User::factory()->create([
            'name' => 'Has 2FA',
            'email' => 'has-2fa@example.com',
        ]);
        $withTwoFactor->forceFill(['two_factor_confirmed_at' => now()])->save();

        User::factory()->create([
            'name' => 'No 2FA',
            'email' => 'no-2fa@example.com',
        ]);

        $response = $this->actingAs($admin)
            ->withHeader('referer', 'http://localhost')
            ->getJson('/internal/users');

        $response->assertOk();

        $byName = collect($response->json())->keyBy('name');

        $this->assertTrue($byName['Has 2FA']['two_factor_enabled']);
        $this->assertFalse($byName['No 2FA']['two_factor_enabled']);
    }

    public function test_a_generated_but_unconfirmed_secret_does_not_count_as_enabled(): void
    {
        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'role' => UserRole::ADMIN,
        ]);

        $pending = User::factory()->create([
            'name' => 'Pending Setup',
            'email' => 'pending@example.com',
        ]);
        // Secret generated during enrolment, but never confirmed with a code.
        $pending->forceFill([
            'two_factor_secret' => encrypt('pending-secret'),
            'two_factor_confirmed_at' => null,
        ])->save();

        $response = $this->actingAs($admin)
            ->withHeader('referer', 'http://localhost')
            ->getJson('/internal/users');

        $response->assertOk();

        $byName = collect($response->json())->keyBy('name');

        $this->assertFalse($byName['Pending Setup']['two_factor_enabled']);
    }
}
