<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class AnimalListResource extends AnimalBaseResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'profile_picture_url' => $this->resource->when(
                $this->resource->relationLoaded('media'),
                fn () => $this->resource->getMedia('pictures')
                    ->sortBy('order_column')
                    ->first(fn (Media $media) => str_starts_with($media->mime_type ?? '', 'image/'))
                    ?->getTemporaryUrl(now()->addHour(), 'thumbnail'),
            ),
        ]);
    }
}
