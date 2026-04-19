<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class PersonDetailResource extends PersonBaseResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'pictures' => $this->when(
                $this->relationLoaded('media'),
                fn () => $this->getMedia('pictures')
                    ->sortBy('order_column')
                    ->map(fn (Media $media) => [
                        'id' => $media->uuid,
                        'sort_order' => $media->order_column,
                        'url' => $media->getTemporaryUrl(now()->addHour(), 'preview'),
                        'full' => $media->getTemporaryUrl(now()->addHour(), 'full'),
                    ])
                    ->values()
                    ->all(),
            ),
        ]);
    }
}
