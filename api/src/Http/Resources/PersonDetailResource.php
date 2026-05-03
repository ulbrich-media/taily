<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class PersonDetailResource extends PersonBaseResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'pictures' => $this->resource->when(
                $this->resource->relationLoaded('media'),
                fn () => $this->resource->getMedia('pictures')
                    ->sortBy('order_column')
                    ->map(fn (Media $media) => [
                        'id' => $media->uuid,
                        'sort_order' => $media->order_column,
                        'type' => 'image',
                        'url' => $media->getTemporaryUrl(now()->addHour(), 'preview'),
                        'full' => $media->getTemporaryUrl(now()->addHour(), 'full'),
                    ])
                    ->values()
                    ->all(),
            ),
        ]);
    }
}
