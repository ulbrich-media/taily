<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\User;
use Taily\Tests\TestCase;

class AnimalWebsiteUrlTest extends TestCase
{
    use RefreshDatabase;

    private function animal(bool $publish = true): Animal
    {
        $dogs = AnimalType::create(['title' => 'Hund']);

        return Animal::create(['animal_type_id' => $dogs->id, 'name' => 'Bello', 'gender' => 'male', 'do_publish' => $publish]);
    }

    private function act(array $abilities = ['animals:write:website-url']): void
    {
        Sanctum::actingAs(User::factory()->create(['name' => 'Tester', 'email' => 'tester@example.com']), $abilities);
    }

    public function test_website_url_can_be_set(): void
    {
        $animal = $this->animal();
        $this->act();

        $this->putJson("/api/animals/{$animal->id}/website-url", ['website_url' => 'https://example.org/tiere/bello'])
            ->assertOk()
            ->assertJsonPath('website_url', 'https://example.org/tiere/bello');

        $this->assertSame('https://example.org/tiere/bello', $animal->fresh()->website_url);
    }

    public function test_website_url_can_be_cleared(): void
    {
        $animal = $this->animal();
        $animal->update(['website_url' => 'https://example.org/x']);
        $this->act();

        $this->putJson("/api/animals/{$animal->id}/website-url", ['website_url' => null])->assertOk();

        $this->assertNull($animal->fresh()->website_url);
    }

    public function test_invalid_urls_are_rejected(): void
    {
        $animal = $this->animal();
        $this->act();

        foreach (['not a url', 'javascript:alert(1)', 'ftp://example.org/x'] as $url) {
            $this->putJson("/api/animals/{$animal->id}/website-url", ['website_url' => $url])
                ->assertUnprocessable()
                ->assertJsonValidationErrors('website_url');
        }
        $this->assertNull($animal->fresh()->website_url);
    }

    public function test_unpublished_animal_returns_404(): void
    {
        $animal = $this->animal(false);
        $this->act();

        $this->putJson("/api/animals/{$animal->id}/website-url", ['website_url' => 'https://example.org/x'])
            ->assertNotFound();
    }

    public function test_missing_ability_is_forbidden(): void
    {
        $animal = $this->animal();
        $this->act(['animals:read:adoptable']);

        $this->putJson("/api/animals/{$animal->id}/website-url", ['website_url' => 'https://example.org/x'])
            ->assertForbidden();
    }

    public function test_unauthenticated_is_rejected(): void
    {
        $animal = $this->animal();

        $this->putJson("/api/animals/{$animal->id}/website-url", ['website_url' => 'https://example.org/x'])
            ->assertUnauthorized();
    }
}
