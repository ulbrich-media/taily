<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AnimalMedicalTestResource extends JsonResource
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
                'medical_test_id' => $this->resource->pivot->medical_test_id,
                'tested_at' => $this->resource->pivot->tested_at,
                'result' => $this->resource->pivot->result,
                'created_at' => $this->resource->pivot->created_at,
                'updated_at' => $this->resource->pivot->updated_at,
            ],
        ];
    }
}
