<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\Person;
use Taily\Support\Tiervermittlung\AnimalPayloadMapper;
use Taily\Tests\TestCase;

class TiervermittlungPayloadTest extends TestCase
{
    use RefreshDatabase;

    private AnimalPayloadMapper $mapper;

    private AnimalType $dogs;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('animal-pictures');

        $this->mapper = new AnimalPayloadMapper;
        $this->dogs = AnimalType::create(['title' => 'Hund', 'tiervermittlung_species' => 'dog']);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function animal(array $attributes = [], int $images = 1): Animal
    {
        $animal = Animal::create(array_merge([
            'animal_type_id' => $this->dogs->id,
            'name' => 'Bello',
            'gender' => 'male',
            'current_country' => 'DE',
            'do_publish' => true,
            'publish_description' => 'Bello ist ein freundlicher Rüde, der gern spazieren geht und Menschen mag.',
        ], $attributes));

        for ($i = 1; $i <= $images; $i++) {
            $animal->addMedia(UploadedFile::fake()->image("bild-{$i}.jpg", 40, 30))->toMediaCollection('pictures');
        }

        return $animal->fresh(['animalType', 'media', 'adoptions']);
    }

    public function test_it_sends_the_trimmed_title_cut_at_sixty_characters(): void
    {
        $payload = $this->mapper->payload($this->animal(['publish_title' => '  Bello sucht ein Zuhause  ']));
        $this->assertSame('Bello sucht ein Zuhause', $payload['title']);

        // The column holds at most sixty characters, so a longer title only exists in memory.
        $animal = $this->animal();
        $animal->publish_title = str_repeat('a', 60).'b';
        $payload = $this->mapper->payload($animal);
        $this->assertSame(str_repeat('a', 60), $payload['title']);
    }

    public function test_it_leaves_out_a_blank_title_without_blocking_the_export(): void
    {
        foreach (['', '   ', null] as $title) {
            $animal = $this->animal(['publish_title' => $title]);

            $this->assertTrue($this->mapper->isExportable($animal));
            $this->assertArrayNotHasKey('title', $this->mapper->payload($animal));
        }
    }

    public function test_it_maps_a_complete_animal(): void
    {
        $animal = $this->animal([
            'breed' => 'Labrador-Mischling',
            'date_of_birth' => '2022-03-15',
            'size_cm' => 55,
            'is_neutered' => true,
            'is_reserved' => true,
            'tasso_id' => 'T-123',
            'application_url' => 'https://example.org/bewerbung/bello',
        ]);
        $media = $animal->getMedia('pictures')->first();

        $this->assertSame([
            'name' => 'Bello',
            'species' => 'dog',
            'breed' => 'Labrador-Mischling',
            'sex' => 'male',
            'neutered' => true,
            'birthDate' => '2022-03-15',
            'heightCm' => 55,
            'description' => 'Bello ist ein freundlicher Rüde, der gern spazieren geht und Menschen mag.',
            'forAdoption' => true,
            'reserved' => true,
            'chip' => ['present' => true, 'tasso' => true, 'findefix' => false],
            'location' => ['country' => 'DE', 'zip' => '-', 'city' => '-'],
            'images' => [[
                'id' => $media->uuid,
                'url' => route('api.media.serve', ['mediaUuid' => $media->uuid, 'conversion' => 'export']),
            ]],
            'externalUrl' => 'https://example.org/bewerbung/bello',
        ], $this->mapper->payload($animal));
    }

    public function test_it_leaves_out_fields_without_a_value(): void
    {
        $payload = $this->mapper->payload($this->animal());

        foreach (['breed', 'birthDate', 'heightCm', 'externalUrl', 'speciesDetail'] as $field) {
            $this->assertArrayNotHasKey($field, $payload);
        }

        $this->assertSame(['present' => false, 'tasso' => false, 'findefix' => false], $payload['chip']);
    }

    public function test_it_never_sends_chip_numbers_or_internal_data(): void
    {
        $animal = $this->animal([
            'tasso_id' => 'TASSO-4711',
            'findefix_id' => 'FF-0815',
            'trace_id' => 'TRACES-1',
            'internal_notes' => 'Nur intern',
            'health_description' => 'Leishmaniose positiv',
        ]);

        $json = json_encode($this->mapper->payload($animal));

        foreach (['TASSO-4711', 'FF-0815', 'TRACES-1', 'Nur intern', 'Leishmaniose'] as $secret) {
            $this->assertStringNotContainsString($secret, $json);
        }
    }

    public function test_it_sends_the_type_title_as_detail_for_catch_all_species(): void
    {
        $rabbits = AnimalType::create(['title' => 'Kaninchen', 'tiervermittlung_species' => 'small']);
        $animal = $this->animal(['animal_type_id' => $rabbits->id, 'size_cm' => 20]);

        $payload = $this->mapper->payload($animal);

        $this->assertSame('small', $payload['species']);
        $this->assertSame('Kaninchen', $payload['speciesDetail']);
        // The shoulder height is only evaluated for dogs.
        $this->assertArrayNotHasKey('heightCm', $payload);
    }

    public function test_it_sends_at_most_five_images_in_order_and_skips_videos(): void
    {
        $animal = Animal::create([
            'animal_type_id' => $this->dogs->id,
            'name' => 'Bello',
            'gender' => 'male',
            'current_country' => 'DE',
            'do_publish' => true,
            'publish_description' => 'Text',
        ]);
        $animal->addMedia(UploadedFile::fake()->image('a.webp', 40, 30))->toMediaCollection('pictures');
        $animal->addMedia(UploadedFile::fake()->create('video.mp4', 10, 'video/mp4'))->toMediaCollection('pictures');
        $animal->addMedia(UploadedFile::fake()->image('b.gif', 40, 30))->toMediaCollection('pictures');

        for ($i = 1; $i <= 4; $i++) {
            $animal->addMedia(UploadedFile::fake()->image("c{$i}.png", 40, 30))->toMediaCollection('pictures');
        }

        $animal = $animal->fresh(['animalType', 'media', 'adoptions']);
        $expected = $animal->getMedia('pictures')
            ->filter(fn ($media) => str_starts_with($media->mime_type, 'image/'))
            ->take(5)
            ->pluck('uuid')
            ->values()
            ->all();

        $this->assertSame($expected, array_column($this->mapper->payload($animal)['images'], 'id'));
    }

    public function test_every_picture_format_gets_a_jpeg_export_conversion(): void
    {
        $animal = Animal::create([
            'animal_type_id' => $this->dogs->id,
            'name' => 'Bello',
            'gender' => 'male',
        ]);

        foreach (['a.webp', 'b.png', 'c.gif', 'd.jpg'] as $name) {
            $media = $animal->addMedia(UploadedFile::fake()->image($name, 40, 30))->toMediaCollection('pictures');
            $path = $media->getPathRelativeToRoot('export');

            $this->assertStringEndsWith('.jpg', $path);
            $this->assertSame('image/jpeg', Storage::disk('animal-pictures')->mimeType($path));
        }
    }

    public function test_pictures_without_a_generated_export_conversion_are_skipped(): void
    {
        $animal = $this->animal(images: 2);
        $first = $animal->getMedia('pictures')->first();
        $first->markAsConversionNotGenerated('export')->save();

        $animal = $animal->fresh(['animalType', 'media', 'adoptions']);

        $this->assertNotContains($first->uuid, array_column($this->mapper->payload($animal)['images'], 'id'));
        $this->assertCount(1, $this->mapper->payload($animal)['images']);
    }

    public function test_an_animal_meeting_all_requirements_is_exported(): void
    {
        $this->assertSame([], $this->mapper->exclusionReasons($this->animal()));
    }

    public function test_it_names_every_reason_an_animal_is_not_exported(): void
    {
        $unmapped = AnimalType::create(['title' => 'Alpaka']);
        $animal = $this->animal([
            'animal_type_id' => $unmapped->id,
            'do_publish' => false,
            'is_deceased' => true,
            'publish_description' => '   ',
            'current_country' => '',
        ], images: 0);

        $this->assertSame([
            'Das Tier ist nicht zur Veröffentlichung freigegeben.',
            'Das Tier ist verstorben.',
            'Die Tierart ist keiner Tierart auf Tiervermittlung.de zugeordnet.',
            'Es gibt keinen Beschreibungstext.',
            'Es gibt kein Bild.',
            'Das Aufenthaltsland ist nicht angegeben.',
        ], $this->mapper->exclusionReasons($animal));
    }

    public function test_it_lists_the_animal_in_its_country_without_zip_and_city(): void
    {
        $payload = $this->mapper->payload($this->animal(['current_country' => 'RO']));

        $this->assertSame(['country' => 'RO', 'zip' => '-', 'city' => '-'], $payload['location']);
    }

    public function test_adopted_animals_are_removed_as_placed(): void
    {
        $animal = $this->animal();
        $this->assertSame('entfernt', $this->mapper->removalReason($animal));

        $applicant = Person::create(['first_name' => 'Anna', 'last_name' => 'Adopter', 'email' => 'anna@example.com']);
        Adoption::create(['animal_id' => $animal->id, 'applicant_id' => $applicant->id, 'status' => 'done']);
        $animal->load('adoptions');

        $this->assertContains('Das Tier ist bereits vermittelt.', $this->mapper->exclusionReasons($animal));
        $this->assertSame('vermittelt', $this->mapper->removalReason($animal));
        $this->assertSame('entfernt', $this->mapper->removalReason(null));
    }

    public function test_the_hash_changes_with_the_payload(): void
    {
        $animal = $this->animal();
        $before = $this->mapper->hash($this->mapper->payload($animal));

        $this->assertSame($before, $this->mapper->hash($this->mapper->payload($animal)));

        $animal->update(['is_reserved' => true]);

        $this->assertNotSame($before, $this->mapper->hash($this->mapper->payload($animal)));
    }
}
