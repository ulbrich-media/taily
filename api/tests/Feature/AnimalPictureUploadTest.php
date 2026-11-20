<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\User;
use Taily\Support\UploadLimits;
use Taily\Tests\TestCase;

class AnimalPictureUploadTest extends TestCase
{
    use RefreshDatabase;

    private function animal(): Animal
    {
        $dogs = AnimalType::create(['title' => 'Hund']);

        return Animal::create(['animal_type_id' => $dogs->id, 'name' => 'Bello', 'gender' => 'male']);
    }

    private function upload(Animal $animal, UploadedFile $file)
    {
        $user = User::factory()->create(['name' => 'Tester', 'email' => 'tester@example.com']);

        return $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->post("/internal/animals/{$animal->id}/pictures", ['file' => $file], ['Accept' => 'application/json']);
    }

    public function test_media_library_limit_covers_the_largest_validated_upload(): void
    {
        $this->assertGreaterThanOrEqual(UploadLimits::VIDEO_KB * 1024, config('media-library.max_file_size'));
        $this->assertGreaterThanOrEqual(UploadLimits::CONTRACT_KB * 1024, config('media-library.max_file_size'));
    }

    public function test_video_above_ten_megabytes_is_accepted(): void
    {
        Storage::fake('animal-pictures');

        $this->upload($this->animal(), UploadedFile::fake()->create('v.mp4', 12 * 1024, 'video/mp4'))
            ->assertCreated();
    }

    public function test_upload_rejected_by_php_returns_validation_error(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'up');
        $file = new UploadedFile($path, 'big.mp4', 'video/mp4', UPLOAD_ERR_INI_SIZE, true);

        $this->upload($this->animal(), $file)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file');

        @unlink($path);
    }
}
