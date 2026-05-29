<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransportDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $adoptions = $this->resource->relationLoaded('adoptions')
            ? $this->resource->adoptions
                ->map(fn ($adoption) => [
                    'id' => $adoption->id,
                    'animal_id' => $adoption->animal_id,
                    'applicant_id' => $adoption->applicant_id,
                    'animal_name' => $adoption->animal?->name,
                    'applicant_name' => $adoption->applicant?->full_name,
                ])
                ->values()
                ->all()
            : [];

        return [
            'id' => $this->resource->id,
            'planned_at' => $this->resource->planned_at,
            'notes' => $this->resource->notes,
            'done_at' => $this->resource->done_at,
            'is_done' => $this->resource->isDone(),
            'adoptions' => $adoptions,
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
        ];
    }
}
