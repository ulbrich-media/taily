<?php

namespace Taily\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicAnimalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'old_name' => $this->old_name,
            'animal_type_id' => $this->animal_type_id,
            'breed' => $this->breed,
            'gender' => $this->gender,
            'color' => $this->color,
            'date_of_birth' => $this->date_of_birth,
            'intake_date' => $this->intake_date,
            'is_neutered' => $this->is_neutered,
        ];
    }
}
