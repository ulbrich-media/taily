<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AnimalVaccinationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'title' => $this->resource->title,
            'description' => $this->resource->description,
            'animal_type_id' => $this->resource->animal_type_id,
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
            'pivot' => [
                'animal_id' => $this->resource->pivot->animal_id,
                'vaccination_id' => $this->resource->pivot->vaccination_id,
                'vaccinated_at' => $this->resource->pivot->vaccinated_at,
                'created_at' => $this->resource->pivot->created_at,
                'updated_at' => $this->resource->pivot->updated_at,
            ],
        ];
    }
}
