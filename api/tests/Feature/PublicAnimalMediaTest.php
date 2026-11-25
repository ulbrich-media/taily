<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\User;
use Taily\Tests\TestCase;

class PublicAnimalMediaTest extends TestCase
{
    use RefreshDatabase;

    private function publishedAnimal(): Animal
    {
        $dogs = AnimalType::create(['title' => 'Hund']);
        Sanctum::actingAs(User::factory()->create(['name' => 'Tester', 'email' => 'tester@example.com']), ['animals:read:adoptable']);

        return Animal::create(['animal_type_id' => $dogs->id, 'name' => 'Bello', 'gender' => 'male', 'do_publish' => true]);
    }

    public function test_animal_with_picture_is_serialized_with_media(): void
    {
        Storage::fake('animal-pictures');
        $animal = $this->publishedAnimal();
        $media = $animal->addMedia(UploadedFile::fake()->image('a.jpg'))->toMediaCollection('pictures');

        $response = $this->getJson('/api/animals')->assertOk();

        $response->assertJsonPath('0.media.0.id', $media->uuid)
            ->assertJsonPath('0.media.0.type', 'image');
        $item = $response->json('0.media.0');
        $this->assertSame(['id', 'type', 'thumbnail', 'url', 'full'], array_keys($item));
        $this->assertStringContainsString($media->uuid, $item['thumbnail']);
        $this->assertStringContainsString($media->uuid, $item['url']);
        $this->assertStringContainsString($media->uuid, $item['full']);
    }

    public function test_video_has_no_thumbnail(): void
    {
        Storage::fake('animal-pictures');
        $animal = $this->publishedAnimal();
        $media = $animal->addMedia(UploadedFile::fake()->create('v.mp4', 10, 'video/mp4'))->toMediaCollection('pictures');
        // The library detects the mime type from the (empty) fake content, so set it explicitly.
        $media->update(['mime_type' => 'video/mp4']);

        $this->getJson('/api/animals')
            ->assertOk()
            ->assertJsonPath('0.media.0.type', 'video')
            ->assertJsonPath('0.media.0.thumbnail', null);
    }

    public function test_animal_without_pictures_has_empty_media(): void
    {
        $this->publishedAnimal();

        $this->getJson('/api/animals')->assertOk()->assertJsonPath('0.media', []);
    }
}
