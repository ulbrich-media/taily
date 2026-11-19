<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
