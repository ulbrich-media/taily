<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AnimalBaseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            // Tab 1: Basic & Description
            'animal_type_id' => $this->animal_type_id,
            'animal_number' => $this->animal_number,
            'name' => $this->name,
            'old_name' => $this->old_name,
            'breed' => $this->breed,
            'gender' => $this->gender,
            'color' => $this->color,
            'date_of_birth' => $this->date_of_birth,
            'origin_country' => $this->origin_country,
            'is_boarding_animal' => $this->is_boarding_animal,
            'intake_date' => $this->intake_date,
            'character_description' => $this->character_description,
            'contract_notes' => $this->contract_notes,
            'internal_notes' => $this->internal_notes,
            // Tab 2: Health & Identification
            'is_neutered' => $this->is_neutered,
            'health_description' => $this->health_description,
            'tasso_id' => $this->tasso_id,
            'findefix_id' => $this->findefix_id,
            'trace_id' => $this->trace_id,
            // Tab 3: Placement, Contract & Costs
            'assigned_agent_id' => $this->assigned_agent_id,
            'origin_organization' => $this->origin_organization,
            'owner_id' => $this->owner_id,
            'adoption_fee' => $this->adoption_fee,
            'monthly_boarding_cost' => $this->monthly_boarding_cost,
            'monthly_sponsorship' => $this->monthly_sponsorship,
            'sponsor_id' => $this->sponsor_id,
            'sponsor_external' => $this->sponsor_external,
            // Tab 4: Organization, Marketing & Status
            'current_location' => $this->current_location,
            'alternate_transport_trace' => $this->alternate_transport_trace,
            'alternate_arrival_location' => $this->alternate_arrival_location,
            'do_publish' => $this->do_publish,
            'is_deceased' => $this->is_deceased,
            'date_of_death' => $this->date_of_death,
            // Metadata
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            // Relations (only included when eager-loaded)
            'animal_type' => $this->whenLoaded('animalType', fn ($v) => new AnimalTypeResource($v)),
            'assigned_agent' => $this->whenLoaded('assignedAgent', fn ($v) => $v ? new PersonBaseResource($v) : null),
            'owner' => $this->whenLoaded('owner', fn ($v) => $v ? new PersonBaseResource($v) : null),
            'sponsor' => $this->whenLoaded('sponsor', fn ($v) => $v ? new PersonBaseResource($v) : null),
            'adoptions' => AdoptionBaseResource::collection($this->whenLoaded('adoptions')),
            'health_condition_vaccinations' => HealthConditionVaccinationResource::collection($this->whenLoaded('healthConditionVaccinations')),
            'health_condition_tests' => HealthConditionTestResource::collection($this->whenLoaded('healthConditionTests')),
        ];
    }
}
