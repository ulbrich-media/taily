<?php

namespace Taily\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicAnimalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // All data possibly relevant during public display of an animal.
        // No personal information is returned here.
        return [
            'id' => $this->id,
            'animal_type_id' => $this->animal_type_id,
            'animal_number' => $this->animal_number,
            'name' => $this->name,
            'old_name' => $this->old_name,
            'breed' => $this->breed,
            'gender' => $this->gender,
            'color' => $this->color,
            'weight_grams' => $this->weight_grams,
            'size_cm' => $this->size_cm,
            'date_of_birth' => $this->date_of_birth,
            'origin_country' => $this->origin_country,
            'intake_date' => $this->intake_date,
            'character_description' => $this->character_description,
            'contract_notes' => $this->contract_notes,
            'internal_notes' => $this->internal_notes,
            'is_neutered' => $this->is_neutered,
            'health_description' => $this->health_description,
            'adoption_fee' => $this->adoption_fee,
            'current_location' => $this->current_location,
            'do_publish' => $this->do_publish,
            'publish_description' => $this->publish_description,
            'application_url' => $this->application_url,
            'compatibilities' => $this->whenLoaded('compatibilities', fn () => $this->compatibilities->pluck('value')->values()->all(), []
            ),
            'personality_traits' => $this->whenLoaded('personalityTraits', fn () => $this->personalityTraits->pluck('value')->values()->all(), []
            ),
            // Metadata
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            // Relations (only included when eager-loaded)
            'vaccinations' => PublicAnimalVaccinationResource::collection($this->whenLoaded('vaccinations')),
            'medical_tests' => PublicMedicalTestResource::collection($this->whenLoaded('medicalTests')),
        ];
    }
}
