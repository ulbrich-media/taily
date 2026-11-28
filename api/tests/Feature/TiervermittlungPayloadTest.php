<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\AnimalTrait;
use Taily\Models\AnimalType;
use Taily\Models\Person;
use Taily\Support\RichText\RichText;
use Taily\Support\Tiervermittlung\AnimalPayloadMapper;
use Taily\Support\Tiervermittlung\CompatibilityMapping;
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
            'current_postal_code' => '80331',
            'current_city' => 'München',
            'do_publish' => true,
            'publish_description' => 'Bello ist ein freundlicher Rüde, der gern spazieren geht und Menschen mag.',
        ], $attributes));

        for ($i = 1; $i <= $images; $i++) {
            $animal->addMedia(UploadedFile::fake()->image("bild-{$i}.jpg", 40, 30))->toMediaCollection('pictures');
        }

        return $animal->fresh(['animalType', 'media', 'adoptions', 'compatibilities', 'personalityTraits']);
    }

    /**
     * @param  list<string>  $compatibilities
     * @param  list<string>  $personalityTraits
     */
    private function withTraits(Animal $animal, array $compatibilities = [], array $personalityTraits = []): Animal
    {
        foreach ($compatibilities as $value) {
            AnimalTrait::create(['animal_id' => $animal->id, 'type' => 'compatibility', 'value' => $value]);
        }
        foreach ($personalityTraits as $value) {
            AnimalTrait::create(['animal_id' => $animal->id, 'type' => 'personality_trait', 'value' => $value]);
        }

        return $animal->fresh(['animalType', 'media', 'adoptions', 'compatibilities', 'personalityTraits']);
    }

    public function test_it_appends_compatibilities_and_personality_traits_to_the_description(): void
    {
        $animal = $this->withTraits($this->animal(['publish_description' => 'Text']), ['Hunde', 'Kinder'], ['verschmust', 'verspielt']);

        $this->assertSame(
            "Text\n\nVerträglichkeiten: Hunde, Kinder\n\nPersönlichkeit: verschmust, verspielt",
            $this->mapper->payload($animal)['description'],
        );
    }

    public function test_it_appends_only_the_trait_type_that_is_present(): void
    {
        $compat = $this->withTraits($this->animal(['publish_description' => 'Text']), ['Hunde']);
        $this->assertSame("Text\n\nVerträglichkeiten: Hunde", $this->mapper->payload($compat)['description']);

        $personality = $this->withTraits($this->animal(['publish_description' => 'Text']), [], ['verspielt']);
        $this->assertSame("Text\n\nPersönlichkeit: verspielt", $this->mapper->payload($personality)['description']);
    }

    public function test_it_leaves_the_description_unchanged_without_traits(): void
    {
        $this->assertSame('Text', $this->mapper->payload($this->animal(['publish_description' => 'Text']))['description']);
    }

    public function test_a_long_description_is_shortened_so_the_trait_block_stays_complete(): void
    {
        $animal = $this->animal(['publish_description' => str_repeat('a', 25000)]);
        $animal = $this->withTraits($animal, ['Hunde', 'Kinder'], ['verspielt']);

        $description = $this->mapper->payload($animal)['description'];
        $block = "\n\nVerträglichkeiten: Hunde, Kinder\n\nPersönlichkeit: verspielt";

        $this->assertSame(AnimalPayloadMapper::MAX_DESCRIPTION_LENGTH, mb_strlen($description));
        $this->assertStringEndsWith($block, $description);
    }

    public function test_the_description_is_sent_as_plain_text_and_the_limit_counts_the_text_not_the_json(): void
    {
        $doc = RichText::doc(
            RichText::paragraph([RichText::text('Bello ist '), RichText::text('lieb', ['bold']), RichText::text('.')]),
            RichText::bulletList(['verspielt', 'verschmust']),
        );
        $animal = $this->animal(['publish_description' => $doc]);

        $this->assertSame("Bello ist lieb.\n\n- verspielt\n- verschmust", $this->mapper->payload($animal)['description']);

        // 15000 characters of alternating bold and italic text: the JSON is longer than the limit, the text is not.
        $long = RichText::doc(RichText::paragraph(array_map(fn (int $i) => RichText::text(str_repeat('a', 10), [$i % 2 === 0 ? 'bold' : 'italic']), range(1, 1500))));
        $animal = $this->animal(['publish_description' => $long]);

        $this->assertSame(15000, mb_strlen($this->mapper->payload($animal)['description']));
        $this->assertGreaterThan(AnimalPayloadMapper::MAX_DESCRIPTION_LENGTH, strlen((string) $animal->getRawOriginal('publish_description')));
    }

    public function test_an_empty_rich_text_document_is_no_description(): void
    {
        $animal = $this->animal(['publish_description' => RichText::doc(RichText::paragraph('  '))]);

        $this->assertSame('', $animal->getRawOriginal('publish_description'));
        $this->assertContains('Es gibt keinen Beschreibungstext.', $this->mapper->exclusionReasons($animal));
    }

    private function addVideo(Animal $animal, string $name = 'clip.mp4', int $kilobytes = 1000, string $mime = 'video/mp4'): Animal
    {
        $media = $animal->addMedia(UploadedFile::fake()->create($name, $kilobytes, $mime))->toMediaCollection('pictures');

        // Spatie reads type and size from the (empty) fake content, so set them explicitly.
        $media->update(['mime_type' => $mime, 'size' => $kilobytes * 1024]);

        return $animal->fresh(['animalType', 'media', 'adoptions']);
    }

    public function test_it_sends_an_mp4_and_a_mov_video_as_original(): void
    {
        foreach ([['clip.mp4', 'video/mp4'], ['clip.mov', 'video/quicktime']] as [$name, $mime]) {
            $animal = $this->addVideo($this->animal(), $name, 1000, $mime);
            $video = $animal->getMedia('pictures')->first(fn ($m) => $m->mime_type === $mime);

            $this->assertSame([
                'id' => $video->uuid,
                'url' => route('api.media.serve', ['mediaUuid' => $video->uuid]),
            ], $this->mapper->payload($animal)['video']);
            $this->assertCount(1, $this->mapper->payload($animal)['images']);
        }
    }

    public function test_it_sends_only_the_first_video_by_order(): void
    {
        $animal = $this->addVideo($this->animal(), 'first.mp4');
        $animal = $this->addVideo($animal, 'second.mp4');
        $first = $animal->getMedia('pictures')->first(fn ($m) => $m->file_name === 'first.mp4');

        $this->assertSame($first->uuid, $this->mapper->payload($animal)['video']['id']);
    }

    public function test_it_skips_too_large_and_unsupported_videos(): void
    {
        $animal = $this->addVideo($this->animal(), 'big.mp4', 51201);
        $this->assertArrayNotHasKey('video', $this->mapper->payload($animal));

        $animal = $this->addVideo($this->animal(), 'clip.webm', 1000, 'video/webm');
        $this->assertArrayNotHasKey('video', $this->mapper->payload($animal));

        $this->assertArrayNotHasKey('video', $this->mapper->payload($this->animal()));
    }

    public function test_it_sends_a_new_video_id_when_the_video_is_replaced(): void
    {
        $animal = $this->addVideo($this->animal());
        $oldId = $this->mapper->payload($animal)['video']['id'];

        $animal->getMedia('pictures')->first(fn ($m) => $m->mime_type === 'video/mp4')->delete();
        $animal = $this->addVideo($animal->fresh(), 'new.mp4');

        $this->assertNotSame($oldId, $this->mapper->payload($animal)['video']['id']);
    }

    public function test_compatible_with_matches_traits_trimmed_and_case_insensitive(): void
    {
        $animal = $this->animal();
        $animal->traits()->create(['type' => 'compatibility', 'value' => '  kinder ']);
        $animal->traits()->create(['type' => 'compatibility', 'value' => 'RÜDEN']);
        $animal->traits()->create(['type' => 'compatibility', 'value' => 'Kinderlieb']);
        // Only compatibilities count, not personality traits.
        $animal->traits()->create(['type' => 'personality_trait', 'value' => 'Katzen']);

        $payload = $this->mapper->payload($animal->fresh(['animalType', 'media', 'adoptions']));

        $this->assertSame(['children' => true, 'dogs' => true], $payload['compatibleWith']);
    }

    public function test_compatible_with_is_left_out_without_a_match(): void
    {
        $animal = $this->animal();
        $animal->traits()->create(['type' => 'compatibility', 'value' => 'Pferde']);

        $this->assertArrayNotHasKey('compatibleWith', $this->mapper->payload($animal->fresh(['animalType', 'media', 'adoptions'])));
        $this->assertArrayNotHasKey('compatibleWith', $this->mapper->payload($this->animal()));
    }

    public function test_changing_the_mapping_changes_the_hash(): void
    {
        $mapping = new CompatibilityMapping;
        $mapper = new AnimalPayloadMapper($mapping);

        $animal = $this->animal();
        $animal->traits()->create(['type' => 'compatibility', 'value' => 'Kinder']);
        $animal = $animal->fresh(['animalType', 'media', 'adoptions']);

        $before = $mapper->hash($mapper->payload($animal));

        $mapping->save([...CompatibilityMapping::DEFAULTS, 'children' => ['Kids']]);

        $this->assertNotSame($before, $mapper->hash($mapper->payload($animal)));
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
            'location' => ['country' => 'DE', 'zip' => '80331', 'city' => 'München'],
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

    public function test_it_sends_only_the_country_for_animals_abroad(): void
    {
        $payload = $this->mapper->payload($this->animal(['current_country' => 'RO']));

        $this->assertSame(['country' => 'RO'], $payload['location']);
        $this->assertArrayNotHasKey('zip', $payload['location']);
        $this->assertArrayNotHasKey('city', $payload['location']);
    }

    public function test_it_sends_the_recorded_zip_and_city_for_animals_in_germany(): void
    {
        $payload = $this->mapper->payload($this->animal([
            'current_country' => 'DE',
            'current_postal_code' => ' 80331 ',
            'current_city' => 'München',
        ]));

        $this->assertSame(['country' => 'DE', 'zip' => '80331', 'city' => 'München'], $payload['location']);
    }

    public function test_animals_in_germany_without_zip_or_city_are_not_exported(): void
    {
        $withoutLocation = $this->animal(['current_postal_code' => '', 'current_city' => '   ']);
        $withoutCity = $this->animal(['current_postal_code' => '50667', 'current_city' => '']);

        $this->assertSame([
            'Die PLZ des Aufenthaltsorts ist nicht angegeben.',
            'Der Ort des Aufenthaltsorts ist nicht angegeben.',
        ], $this->mapper->exclusionReasons($withoutLocation));
        $this->assertSame(['Der Ort des Aufenthaltsorts ist nicht angegeben.'], $this->mapper->exclusionReasons($withoutCity));
        $this->assertTrue($this->mapper->isBlocked($withoutLocation));
    }

    public function test_animals_abroad_do_not_need_zip_or_city(): void
    {
        $animal = $this->animal(['current_country' => 'RO', 'current_postal_code' => '', 'current_city' => '']);

        $this->assertSame([], $this->mapper->exclusionReasons($animal));
    }

    public function test_it_ignores_a_stored_location_for_animals_abroad(): void
    {
        $payload = $this->mapper->payload($this->animal([
            'current_country' => 'RO', 'current_postal_code' => '80331', 'current_city' => 'München',
        ]));

        $this->assertSame(['country' => 'RO'], $payload['location']);
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
