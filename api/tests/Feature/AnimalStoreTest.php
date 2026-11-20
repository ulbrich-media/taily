<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\User;
use Taily\Tests\TestCase;

class AnimalStoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_an_animal_saves_origin_country_and_current_location(): void
    {
        $dogs = AnimalType::create(['title' => 'Hund']);
        $user = User::factory()->create([
            'name' => 'Tester',
            'email' => 'tester@example.com',
        ]);

        $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->postJson('/internal/animals', [
                'animal_type_id' => $dogs->id,
                'name' => 'Bello',
                'gender' => 'male',
                'origin_country' => 'Rumänien',
                'current_location' => 'Pflegestelle Berlin',
            ])
            ->assertSuccessful();

        $animal = Animal::query()->where('name', 'Bello')->firstOrFail();
        $this->assertSame('Rumänien', $animal->origin_country);
        $this->assertSame('Pflegestelle Berlin', $animal->current_location);
    }

    public function test_publish_title_is_optional_and_limited_to_sixty_characters(): void
    {
        $dogs = AnimalType::create(['title' => 'Hund']);
        $animal = Animal::create(['animal_type_id' => $dogs->id, 'name' => 'Bello', 'gender' => 'male']);
        $user = User::factory()->create(['name' => 'Tester', 'email' => 'tester@example.com']);

        $update = fn (array $data) => $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->putJson("/internal/animals/{$animal->id}", $data);

        $update(['publish_title' => str_repeat('a', 61)])->assertUnprocessable();
        $update(['publish_title' => str_repeat('a', 60)])->assertSuccessful();
        $this->assertSame(str_repeat('a', 60), $animal->fresh()->publish_title);

        $update(['publish_title' => null])->assertSuccessful();
    }

    public function test_public_api_exposes_the_publish_title(): void
    {
        $dogs = AnimalType::create(['title' => 'Hund']);
        Animal::create([
            'animal_type_id' => $dogs->id, 'name' => 'Bello', 'gender' => 'male',
            'do_publish' => true, 'publish_title' => 'Bello sucht ein Zuhause',
        ]);
        Sanctum::actingAs(User::factory()->create(['name' => 'Tester', 'email' => 'tester@example.com']), ['animals:read:adoptable']);

        $this->getJson('/api/animals')
            ->assertSuccessful()
            ->assertJsonPath('0.publish_title', 'Bello sucht ein Zuhause');
    }
}
