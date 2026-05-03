<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;

class PersonListResource extends PersonBaseResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'profile_picture_url' => $this->resource->when(
                $this->resource->relationLoaded('media'),
                fn () => $this->resource->getMedia('pictures')
                    ->sortBy('order_column')
                    ->first()
                    ?->getTemporaryUrl(now()->addHour(), 'thumbnail'),
            ),
        ]);
    }
}
