<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransportListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'planned_at' => $this->resource->planned_at,
            'notes' => $this->resource->notes,
            'done_at' => $this->resource->done_at,
            'is_done' => $this->resource->isDone(),
            'animal_count' => $this->resource->relationLoaded('adoptions')
                ? $this->resource->adoptions->count()
                : 0,
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
        ];
    }
}
