<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Taily\Enums\UserRole;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\Person;
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

    public function test_the_status_lists_approved_animals_that_are_not_exported(): void
    {
        config(['taily.tiervermittlung.enabled' => true, 'taily.tiervermittlung.api_key' => 'secret-key']);

        $type = AnimalType::create(['title' => 'Hund', 'tiervermittlung_species' => 'dog']);
        $blocked = Animal::create(['animal_type_id' => $type->id, 'name' => 'Bello', 'gender' => 'male', 'do_publish' => true]);
        Animal::create(['animal_type_id' => $type->id, 'name' => 'Luna', 'gender' => 'female']);
        Animal::create(['animal_type_id' => $type->id, 'name' => 'Rex', 'gender' => 'male', 'do_publish' => true, 'is_deceased' => true]);
        $adopted = Animal::create(['animal_type_id' => $type->id, 'name' => 'Max', 'gender' => 'male', 'do_publish' => true]);
        $applicant = Person::create(['first_name' => 'Anna', 'last_name' => 'Adopter', 'email' => 'anna@example.com']);
        Adoption::create(['animal_id' => $adopted->id, 'applicant_id' => $applicant->id, 'status' => 'done']);

        $this->actingAs($this->user(UserRole::USER))
            ->getJson(self::URL)
            ->assertOk()
            ->assertJsonCount(1, 'status.not_exported')
            ->assertJsonPath('status.not_exported.0.animal_id', $blocked->id)
            ->assertJsonPath('status.not_exported.0.animal_type_id', $type->id)
            ->assertJsonPath('status.not_exported.0.name', 'Bello')
            ->assertJsonPath('status.not_exported.0.reasons.0', 'Es gibt keinen Beschreibungstext.');
    }

    public function test_nothing_is_listed_as_not_exported_while_the_export_is_inactive(): void
    {
        $type = AnimalType::create(['title' => 'Hund', 'tiervermittlung_species' => 'dog']);
        Animal::create(['animal_type_id' => $type->id, 'name' => 'Bello', 'gender' => 'male', 'do_publish' => true]);

        config(['taily.tiervermittlung.enabled' => false, 'taily.tiervermittlung.api_key' => 'secret-key']);
        $this->actingAs($this->user(UserRole::USER))->getJson(self::URL)
            ->assertJsonPath('status.not_exported', []);

        config(['taily.tiervermittlung.enabled' => true, 'taily.tiervermittlung.api_key' => '']);
        $this->actingAs($this->user(UserRole::USER))->getJson(self::URL)
            ->assertJsonPath('status.not_exported', []);
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
