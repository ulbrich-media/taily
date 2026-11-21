<?php

namespace Taily\Support\Tiervermittlung;

use Illuminate\Support\Str;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Taily\Enums\TiervermittlungSpecies;
use Taily\Models\Animal;
use Taily\Support\AnimalNumberGenerator;

/**
 * Decides whether an animal goes to Tiervermittlung.de and builds the
 * payload for it. Expects `animalType`, `media`, `adoptions`,
 * `compatibilities` and `personalityTraits` to be loaded
 * (they are loaded on demand otherwise).
 *
 * The payload carries public data only: no chip numbers, health records or
 * people — the platform shows the account's own contact details.
 */
class AnimalPayloadMapper
{
    /** The platform takes at most five images; the first is the title image. */
    public const MAX_IMAGES = 5;

    /** The only video types the platform converts. */
    public const VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime'];

    /** The platform rejects larger videos; its "50 MB" is read as 50 MiB. */
    public const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

    public const MAX_TITLE_LENGTH = 60;

    public const MAX_DESCRIPTION_LENGTH = 20000;

    /**
     * The JPEG conversion every picture gets, whatever format was uploaded;
     * the platform only accepts JPEG or PNG.
     */
    public const IMAGE_CONVERSION = 'export';

    /**
     * Taily only knows the country an animal lives in. The platform requires
     * zip and city only for Germany (DE), so this placeholder is sent there
     * until a concrete location is tracked; for other countries nothing is
     * sent. The Bundesland is derived by the platform from the zip code and
     * is never sent.
     */
    public const UNKNOWN_LOCATION_PART = '-';

    private CompatibilityMapping $compatibility;

    public function __construct(?CompatibilityMapping $compatibility = null)
    {
        $this->compatibility = $compatibility ?? new CompatibilityMapping;
    }

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

        if ($animal->current_country === '') {
            $reasons[] = 'Das Aufenthaltsland ist nicht angegeben.';
        }

        if (! preg_match(AnimalNumberGenerator::PATTERN, (string) $animal->animal_number)) {
            $reasons[] = 'Die Tiernummer enthält Zeichen, die Tiervermittlung.de nicht akzeptiert (erlaubt: Buchstaben, Ziffern, - und _).';
        }

        return $reasons;
    }

    /**
     * Deceased and adopted animals are left out on purpose; nobody has to
     * fix anything for them.
     */
    public function isIntentionallyExcluded(Animal $animal): bool
    {
        return $animal->is_deceased || $this->isAdopted($animal);
    }

    /**
     * Approved for publishing, but kept out of the export for a reason
     * somebody can fix.
     */
    public function isBlocked(Animal $animal): bool
    {
        return $animal->do_publish
            && ! $this->isIntentionallyExcluded($animal)
            && $this->exclusionReasons($animal) !== [];
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
     * The animal number is the user-facing id on the platform. It is always
     * set and unique; numbers that do not fit the platform's pattern keep the
     * animal out of the export (see `exclusionReasons`).
     */
    public function tierId(Animal $animal): string
    {
        return (string) $animal->animal_number;
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

        $title = trim($animal->publish_title ?? '');
        $video = $this->video($animal);

        $payload = [
            'name' => $animal->name,
            'species' => $species->value,
            'speciesDetail' => $species->wantsDetail() ? $animal->animalType->title : null,
            'breed' => $animal->breed ?: null,
            'sex' => $animal->gender,
            'neutered' => (bool) $animal->is_neutered,
            'birthDate' => $animal->date_of_birth?->format('Y-m-d'),
            'heightCm' => $species === TiervermittlungSpecies::DOG ? $animal->size_cm : null,
            'title' => $title !== '' ? Str::limit($title, self::MAX_TITLE_LENGTH, '') : null,
            'description' => $this->description($animal),
            'forAdoption' => true,
            'reserved' => (bool) $animal->is_reserved,
            // Only whether the animal is chipped and registered, never the
            // numbers themselves — the platform forbids sending them.
            'chip' => [
                'present' => $animal->tasso_id !== '' || $animal->findefix_id !== '',
                'tasso' => $animal->tasso_id !== '',
                'findefix' => $animal->findefix_id !== '',
            ],
            'location' => $this->location($animal),
            'images' => array_map(fn (Media $media) => [
                // A new upload gets a new uuid, so the platform only downloads
                // images it has not seen before.
                'id' => $media->uuid,
                'url' => route('api.media.serve', ['mediaUuid' => $media->uuid, 'conversion' => self::IMAGE_CONVERSION]),
            ], $this->images($animal)),
            'video' => $video !== null ? [
                // Same pattern as images: a replaced video has a new uuid, so
                // the platform only downloads it when it actually changed.
                'id' => $video->uuid,
                'url' => route('api.media.serve', ['mediaUuid' => $video->uuid]),
            ] : null,
            'externalUrl' => $animal->application_url ?: null,
            // The options whose configured words match one of the animal's
            // compatibilities; none matching leaves the key out.
            'compatibleWith' => $this->compatibility->match($animal->compatibilities->pluck('value')) ?: null,
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
     * The description with the animal's compatibilities and personality
     * traits appended as plain text. The description is shortened first, so
     * the trait block is never cut off and the total stays within the limit.
     */
    private function description(Animal $animal): string
    {
        $base = trim($animal->publish_description ?? '');

        $lines = [];
        foreach (['Verträglichkeiten' => $animal->compatibilities, 'Persönlichkeit' => $animal->personalityTraits] as $label => $traits) {
            if ($traits->isNotEmpty()) {
                $lines[] = $label.': '.$traits->pluck('value')->implode(', ');
            }
        }

        if ($lines === []) {
            return Str::limit($base, self::MAX_DESCRIPTION_LENGTH, '');
        }

        $block = "\n\n".implode("\n\n", $lines);
        $room = max(0, self::MAX_DESCRIPTION_LENGTH - mb_strlen($block));

        return Str::limit(rtrim(Str::limit($base, $room, '')).$block, self::MAX_DESCRIPTION_LENGTH, '');
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

    /**
     * The first video by order that the platform accepts. The original file
     * is sent (no conversion).
     */
    private function video(Animal $animal): ?Media
    {
        return $animal->getMedia('pictures')
            ->sortBy('order_column')
            ->first(fn (Media $media) => in_array($media->mime_type, self::VIDEO_MIME_TYPES, true)
                && $media->size <= self::MAX_VIDEO_BYTES);
    }

    /**
     * @return array<string, string>
     */
    private function location(Animal $animal): array
    {
        $location = ['country' => $animal->current_country];

        if ($animal->current_country === 'DE') {
            $location['zip'] = self::UNKNOWN_LOCATION_PART;
            $location['city'] = self::UNKNOWN_LOCATION_PART;
        }

        return $location;
    }

    private function isAdopted(Animal $animal): bool
    {
        return $animal->adoptions->contains('status', 'done');
    }
}
