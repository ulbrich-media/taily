<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class AnimalDetailResource extends AnimalBaseResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'pictures' => $this->when(
                $this->relationLoaded('media'),
                fn () => $this->getMedia('pictures')
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
        ]);
    }
}
