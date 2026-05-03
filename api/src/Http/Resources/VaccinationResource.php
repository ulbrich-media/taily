<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VaccinationResource extends JsonResource
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
            'animal_type' => $this->whenLoaded('animalType', fn ($v) => new AnimalTypeResource($v)),
        ];
    }
}
