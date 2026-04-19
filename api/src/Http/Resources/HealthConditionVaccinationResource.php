<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * HealthCondition as returned inside an Animal's health_condition_vaccinations array.
 * Includes pivot data from the animal_health_condition_vaccination table.
 */
class HealthConditionVaccinationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'animal_type_id' => $this->animal_type_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'pivot' => [
                'animal_id' => $this->pivot->animal_id,
                'health_condition_id' => $this->pivot->health_condition_id,
                'vaccinated_at' => $this->pivot->vaccinated_at,
                'created_at' => $this->pivot->created_at,
                'updated_at' => $this->pivot->updated_at,
            ],
        ];
    }
}
