<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
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

    /**
     * @param  array<string, mixed>  $data
     */
    private function store(array $data): TestResponse
    {
        $dogs = AnimalType::firstOrCreate(['title' => 'Hund']);

        return $this->actingAs(User::firstOrCreate(['email' => 'tester@example.com'], ['name' => 'Tester', 'password' => 'secret-password']))
            ->withHeader('referer', 'http://localhost')
            ->postJson('/internal/animals', array_merge(['animal_type_id' => $dogs->id, 'name' => 'Bello', 'gender' => 'male'], $data));
    }

    public function test_an_animal_without_number_gets_a_generated_one(): void
    {
        foreach ([[], ['animal_number' => ''], ['animal_number' => '   ']] as $data) {
            $number = $this->store($data)->assertCreated()->json('data.animal_number');

            $this->assertMatchesRegularExpression('/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/', $number);
            $this->assertMatchesRegularExpression('/[A-Z]/', $number);
        }
    }

    public function test_a_custom_number_is_kept_and_must_be_unique_and_well_formed(): void
    {
        $this->store(['animal_number' => ' EXT-4711 '])->assertCreated()->assertJsonPath('data.animal_number', 'EXT-4711');

        $this->store(['animal_number' => 'EXT-4711'])->assertUnprocessable()->assertJsonValidationErrors('animal_number');
        $this->store(['animal_number' => 'ä b'])->assertUnprocessable()->assertJsonValidationErrors('animal_number');
        $this->store(['animal_number' => str_repeat('A', 65)])->assertUnprocessable()->assertJsonValidationErrors('animal_number');
    }

    public function test_the_number_cannot_be_changed_afterwards(): void
    {
        $id = $this->store(['animal_number' => 'EXT-1'])->assertCreated()->json('data.id');

        $update = fn (array $data) => $this->putJson("/internal/animals/{$id}", $data);

        $update(['animal_number' => 'EXT-2'])->assertUnprocessable()->assertJsonValidationErrors('animal_number');
        $update(['animal_number' => 'EXT-1', 'name' => 'Luna'])->assertSuccessful();

        $animal = Animal::findOrFail($id);
        $this->assertSame('EXT-1', $animal->animal_number);
        $this->assertSame('Luna', $animal->name);
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
