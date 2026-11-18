<?php

namespace Taily\Support\Tiervermittlung;

use Illuminate\Support\Str;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Taily\Enums\TiervermittlungSpecies;
use Taily\Models\Animal;

/**
 * Decides whether an animal goes to Tiervermittlung.de and builds the
 * payload for it. Expects `animalType`, `media` and `adoptions` to be loaded
 * (they are loaded on demand otherwise).
 *
 * The payload carries public data only: no chip numbers, health records or
 * people — the platform shows the account's own contact details.
 */
class AnimalPayloadMapper
{
    /** The platform takes at most five images; the first is the title image. */
    public const MAX_IMAGES = 5;

    public const MAX_DESCRIPTION_LENGTH = 20000;

    /**
     * The JPEG conversion every picture gets, whatever format was uploaded;
     * the platform only accepts JPEG or PNG.
     */
    public const IMAGE_CONVERSION = 'export';

    /**
     * @param  array{country: string, zip: string, city: string}  $location
     */
    public function __construct(private array $location) {}

    /**
     * Why the animal is not exported, as German text for the admin UI.
     * Empty when the animal is exported.
     *
     * The base rule is the same as for the website and the public API
     * (`do_publish`); the rest are animals that must not be advertised any
     * more, or requirements of the platform.
     *
     * @return list<string>
     */
    public function exclusionReasons(Animal $animal): array
    {
        $reasons = [];

        if (! $animal->do_publish) {
            $reasons[] = 'Das Tier ist nicht zur Veröffentlichung freigegeben.';
        }

        if ($animal->is_deceased) {
            $reasons[] = 'Das Tier ist verstorben.';
        }

        if ($this->isAdopted($animal)) {
            $reasons[] = 'Das Tier ist bereits vermittelt.';
        }

        if ($animal->animalType?->tiervermittlung_species === null) {
            $reasons[] = 'Die Tierart ist keiner Tierart auf Tiervermittlung.de zugeordnet.';
        }

        if (trim($animal->publish_description ?? '') === '') {
            $reasons[] = 'Es gibt keinen Beschreibungstext.';
        }

        if ($this->images($animal) === []) {
            $reasons[] = 'Es gibt kein Bild.';
        }

        return $reasons;
    }

    public function isExportable(Animal $animal): bool
    {
        return $this->exclusionReasons($animal) === [];
    }

    /**
     * The `grund` for removing the listing of an animal that is no longer
     * exported: placed animals count towards the platform's statistics.
     */
    public function removalReason(?Animal $animal): string
    {
        return $animal !== null && $this->isAdopted($animal) ? 'vermittelt' : 'entfernt';
    }

    /**
     * The animal's id never changes and fits the platform's tier id pattern,
     * unlike the animal number, which can be empty or be edited.
     */
    public function tierId(Animal $animal): string
    {
        return $animal->id;
    }

    /**
     * The complete state of the animal as the platform expects it on PUT.
     * Fields without a value are left out.
     *
     * @return array<string, mixed>
     */
    public function payload(Animal $animal): array
    {
        /** @var TiervermittlungSpecies $species */
        $species = $animal->animalType->tiervermittlung_species;

        $payload = [
            'name' => $animal->name,
            'species' => $species->value,
            'speciesDetail' => $species->wantsDetail() ? $animal->animalType->title : null,
            'breed' => $animal->breed ?: null,
            'sex' => $animal->gender,
            'neutered' => (bool) $animal->is_neutered,
            'birthDate' => $animal->date_of_birth?->format('Y-m-d'),
            'heightCm' => $species === TiervermittlungSpecies::DOG ? $animal->size_cm : null,
            'description' => Str::limit(trim($animal->publish_description), self::MAX_DESCRIPTION_LENGTH, ''),
            'forAdoption' => true,
            'reserved' => (bool) $animal->is_reserved,
            // Only whether the animal is chipped and registered, never the
            // numbers themselves — the platform forbids sending them.
            'chip' => [
                'present' => $animal->tasso_id !== '' || $animal->findefix_id !== '',
                'tasso' => $animal->tasso_id !== '',
                'findefix' => $animal->findefix_id !== '',
            ],
            'location' => [
                'country' => $this->location['country'],
                'zip' => $this->location['zip'],
                'city' => $this->location['city'],
            ],
            'images' => array_map(fn (Media $media) => [
                // A new upload gets a new uuid, so the platform only downloads
                // images it has not seen before.
                'id' => $media->uuid,
                'url' => route('api.media.serve', ['mediaUuid' => $media->uuid, 'conversion' => self::IMAGE_CONVERSION]),
            ], $this->images($animal)),
            'externalUrl' => $animal->application_url ?: null,
        ];

        return array_filter($payload, fn ($value) => $value !== null);
    }

    /**
     * A stable fingerprint of the payload, to tell whether anything changed
     * since the last delivery.
     *
     * @param  array<string, mixed>  $payload
     */
    public function hash(array $payload): string
    {
        return hash('sha256', json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }

    /**
     * @return list<Media>
     */
    private function images(Animal $animal): array
    {
        return $animal->getMedia('pictures')
            ->sortBy('order_column')
            // Videos have no conversions; pictures uploaded before the export
            // conversion existed are skipped until it is regenerated.
            ->filter(fn (Media $media) => str_starts_with($media->mime_type ?? '', 'image/')
                && $media->hasGeneratedConversion(self::IMAGE_CONVERSION))
            ->take(self::MAX_IMAGES)
            ->values()
            ->all();
    }

    private function isAdopted(Animal $animal): bool
    {
        return $animal->adoptions->contains('status', 'done');
    }
}
