<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Taily\Models\TiervermittlungListing;
use Taily\Support\Tiervermittlung\AnimalPayloadMapper;
use Taily\Support\Tiervermittlung\TiervermittlungExport;

class AnimalDetailResource extends AnimalBaseResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'pictures' => $this->resource->when(
                $this->resource->relationLoaded('media'),
                fn () => $this->resource->getMedia('pictures')
                    ->sortBy('order_column')
                    ->map(function (Media $media) {
                        $isVideo = str_starts_with($media->mime_type ?? '', 'video/');

                        return [
                            'id' => $media->uuid,
                            'sort_order' => $media->order_column,
                            'type' => $isVideo ? 'video' : 'image',
                            'url' => $isVideo
                                ? $media->getTemporaryUrl(now()->addHour())
                                : $media->getTemporaryUrl(now()->addHour(), 'preview'),
                            'full' => $isVideo
                                ? $media->getTemporaryUrl(now()->addHour())
                                : $media->getTemporaryUrl(now()->addHour(), 'full'),
                        ];
                    })
                    ->values()
                    ->all(),
            ),
            'tiervermittlung' => $this->when(
                $this->resource->relationLoaded('tiervermittlungListing') && TiervermittlungExport::isActive(),
                fn () => $this->tiervermittlung(),
            ),
        ]);
    }

    /**
     * Whether the animal is exported to Tiervermittlung.de and what the
     * platform answered on the last delivery. Absent when the export is not
     * active (disabled or no API key).
     */
    private function tiervermittlung(): array
    {
        /** @var TiervermittlungListing|null $listing */
        $listing = $this->resource->tiervermittlungListing;

        $mapper = app(AnimalPayloadMapper::class);

        return [
            'exclusion_reasons' => $mapper->exclusionReasons($this->resource),
            'blocked' => $mapper->isBlocked($this->resource),
            'intentionally_excluded' => $mapper->isIntentionallyExcluded($this->resource),
            'listing' => $listing ? [
                'status' => $listing->status,
                'tv_id' => $listing->tv_id,
                'url' => $listing->url,
                'reasons' => $listing->reasons ?? [],
                'warnings' => $listing->warnings ?? [],
                'last_error' => $listing->last_error ?? '',
                'last_sent_at' => $listing->last_sent_at,
            ] : null,
        ];
    }
}
