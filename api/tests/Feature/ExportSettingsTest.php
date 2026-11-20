<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Taily\Enums\UserRole;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\TiervermittlungListing;
use Taily\Models\User;
use Taily\Tests\TestCase;

class ExportSettingsTest extends TestCase
{
    use RefreshDatabase;

    private const URL = '/internal/export-settings/tiervermittlung';

    private function user(UserRole $role): User
    {
        return User::factory()->create([
            'name' => 'Tester',
            'email' => uniqid($role->value.'-').'@example.com',
            'role' => $role,
        ]);
    }

    public function test_defaults_are_seeded(): void
    {
        $this->actingAs($this->user(UserRole::ADMIN))
            ->getJson(self::URL)
            ->assertOk()
            ->assertJsonPath('compatibleWith.children', ['Kinder'])
            ->assertJsonPath('compatibleWith.dogs', ['Hunde', 'Rüden', 'Hündinnen'])
            ->assertJsonPath('compatibleWith.cats', ['Katzen']);
    }

    public function test_a_non_admin_can_read_but_not_change_the_settings(): void
    {
        $user = $this->user(UserRole::USER);

        $this->actingAs($user)->getJson(self::URL)->assertOk();

        $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->putJson(self::URL, ['compatibleWith' => ['children' => ['Kids'], 'dogs' => [], 'cats' => []]])
            ->assertForbidden();
    }

    public function test_guests_are_rejected(): void
    {
        $this->getJson(self::URL)->assertUnauthorized();
    }

    public function test_an_admin_can_save_a_normalized_mapping(): void
    {
        $this->actingAs($this->user(UserRole::ADMIN))
            ->withHeader('referer', 'http://localhost')
            ->putJson(self::URL, ['compatibleWith' => [
                'children' => [' Kids ', 'kids', ''],
                'dogs' => ['Hunde'],
                'cats' => [],
            ]])
            ->assertOk()
            ->assertJsonPath('compatibleWith.children', ['Kids'])
            ->assertJsonPath('compatibleWith.cats', []);

        $this->actingAs($this->user(UserRole::ADMIN))
            ->getJson(self::URL)
            ->assertJsonPath('compatibleWith.children', ['Kids'])
            ->assertJsonPath('compatibleWith.dogs', ['Hunde']);
    }

    public function test_the_mapping_is_validated(): void
    {
        $admin = $this->user(UserRole::ADMIN);

        $this->actingAs($admin)
            ->withHeader('referer', 'http://localhost')
            ->putJson(self::URL, ['compatibleWith' => ['children' => [str_repeat('a', 256)], 'dogs' => [], 'cats' => []]])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['compatibleWith.children.0']);

        $this->actingAs($admin)
            ->withHeader('referer', 'http://localhost')
            ->putJson(self::URL, ['compatibleWith' => ['children' => []]])
            ->assertUnprocessable();
    }

    public function test_the_status_reports_configuration_listings_and_last_delivery(): void
    {
        config(['taily.tiervermittlung.enabled' => true, 'taily.tiervermittlung.api_key' => 'secret-key']);

        $type = AnimalType::create(['title' => 'Hund']);
        $animal = Animal::create(['animal_type_id' => $type->id, 'name' => 'Bello', 'gender' => 'male']);
        TiervermittlungListing::create([
            'animal_id' => $animal->id,
            'tier_id' => $animal->animal_number,
            'status' => 'abgelehnt',
            'last_error' => 'kaputt',
            'last_sent_at' => now()->subDay(),
        ]);
        $other = Animal::create(['animal_type_id' => $type->id, 'name' => 'Luna', 'gender' => 'female']);
        TiervermittlungListing::create([
            'animal_id' => $other->id,
            'tier_id' => $other->animal_number,
            'status' => 'veroeffentlicht',
            'last_sent_at' => '2026-11-01 10:00:00',
        ]);

        $response = $this->actingAs($this->user(UserRole::USER))
            ->getJson(self::URL)
            ->assertOk()
            ->assertJsonPath('status.enabled', true)
            ->assertJsonPath('status.api_key_configured', true)
            ->assertJsonPath('status.listings.veroeffentlicht', 1)
            ->assertJsonPath('status.listings.abgelehnt', 1)
            ->assertJsonPath('status.listings.doppelt', 0)
            ->assertJsonPath('status.attention.0.name', 'Bello')
            ->assertJsonPath('status.attention.0.animal_type_id', $type->id);

        $this->assertStringNotContainsString('secret-key', $response->getContent());
        $this->assertStringStartsWith('2026-11-01', $response->json('status.last_delivery_at'));
    }

    public function test_the_status_without_configuration(): void
    {
        config(['taily.tiervermittlung.enabled' => false, 'taily.tiervermittlung.api_key' => '']);

        $this->actingAs($this->user(UserRole::USER))
            ->getJson(self::URL)
            ->assertJsonPath('status.enabled', false)
            ->assertJsonPath('status.api_key_configured', false)
            ->assertJsonPath('status.last_delivery_at', null);
    }
}
