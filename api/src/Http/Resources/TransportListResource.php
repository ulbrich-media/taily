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
            'name' => $this->resource->name,
            'planned_at' => $this->resource->planned_at,
            'notes' => $this->resource->notes,
            'done_at' => $this->resource->done_at,
            'is_done' => $this->resource->isDone(),
            'responsible_id' => $this->resource->responsible_id,
            'responsible' => $this->resource->relationLoaded('responsible') && $this->resource->responsible
                ? new PersonListResource($this->resource->responsible)
                : null,
            'transporter' => $this->resource->transporter,
            'adoptions' => $this->resource->relationLoaded('adoptions')
                ? AdoptionListResource::collection($this->resource->adoptions)
                : [],
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
        ];
    }
}
