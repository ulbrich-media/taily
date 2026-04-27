<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AnimalMedicalTestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'animal_type_id' => $this->animal_type_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'pivot' => [
                'animal_id' => $this->pivot->animal_id,
                'medical_test_id' => $this->pivot->medical_test_id,
                'tested_at' => $this->pivot->tested_at,
                'result' => $this->pivot->result,
                'created_at' => $this->pivot->created_at,
                'updated_at' => $this->pivot->updated_at,
            ],
        ];
    }
}
