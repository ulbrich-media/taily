<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Taily\Enums\UserRole;
use Taily\Models\Person;
use Taily\Models\User;
use Taily\Tests\TestCase;

class UserPersonLinkTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'role' => UserRole::ADMIN,
        ]);
    }

    private function person(): Person
    {
        return Person::create(['first_name' => 'Erika', 'last_name' => 'Muster']);
    }

    public function test_user_can_be_created_with_a_person(): void
    {
        Mail::fake();
        $person = $this->person();

        $response = $this->actingAs($this->admin())
            ->withHeader('referer', 'http://localhost')
            ->postJson('/internal/users', [
                'name' => 'New User',
                'email' => 'new@example.com',
                'role' => 'user',
                'person_id' => $person->id,
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.person_id', $person->id)
            ->assertJsonPath('data.person.full_name', 'Erika Muster');
    }

    public function test_user_can_be_created_without_a_person(): void
    {
        Mail::fake();

        $this->actingAs($this->admin())
            ->withHeader('referer', 'http://localhost')
            ->postJson('/internal/users', [
                'name' => 'New User',
                'email' => 'new@example.com',
                'role' => 'user',
            ])
            ->assertCreated()
            ->assertJsonPath('data.person_id', null);
    }

    public function test_person_can_be_linked_and_unlinked_on_update(): void
    {
        $person = $this->person();
        $admin = $this->admin();
        $user = User::factory()->create(['name' => 'U', 'email' => 'u@example.com']);
        $payload = ['name' => 'U', 'email' => 'u@example.com', 'role' => 'user'];

        $this->actingAs($admin)->withHeader('referer', 'http://localhost')
            ->putJson("/internal/users/{$user->id}", $payload + ['person_id' => $person->id])
            ->assertOk()
            ->assertJsonPath('data.person_id', $person->id);

        $this->actingAs($admin)->withHeader('referer', 'http://localhost')
            ->putJson("/internal/users/{$user->id}", $payload + ['person_id' => null])
            ->assertOk()
            ->assertJsonPath('data.person_id', null);

        $this->assertNull($user->fresh()->person_id);
    }

    public function test_person_can_only_be_linked_to_one_user(): void
    {
        $person = $this->person();
        $admin = $this->admin();
        User::factory()->create([
            'name' => 'Owner',
            'email' => 'owner@example.com',
            'person_id' => $person->id,
        ]);
        $other = User::factory()->create(['name' => 'O', 'email' => 'o@example.com']);

        $this->actingAs($admin)->withHeader('referer', 'http://localhost')
            ->putJson("/internal/users/{$other->id}", [
                'name' => 'O',
                'email' => 'o@example.com',
                'role' => 'user',
                'person_id' => $person->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('person_id');
    }

    public function test_unknown_person_is_rejected(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->withHeader('referer', 'http://localhost')
            ->putJson("/internal/users/{$admin->id}", [
                'name' => 'Admin',
                'email' => 'admin@example.com',
                'role' => 'admin',
                'person_id' => '00000000-0000-0000-0000-000000000000',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('person_id');
    }

    public function test_deleting_a_person_clears_the_link(): void
    {
        $person = $this->person();
        $user = User::factory()->create([
            'name' => 'L',
            'email' => 'l@example.com',
            'person_id' => $person->id,
        ]);

        $person->delete();

        $this->assertNull($user->fresh()->person_id);
    }
}
