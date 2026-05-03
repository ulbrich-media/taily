<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AnimalBaseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            // Tab 1: Basic & Description
            'animal_type_id' => $this->resource->animal_type_id,
            'animal_number' => $this->resource->animal_number,
            'name' => $this->resource->name,
            'old_name' => $this->resource->old_name,
            'breed' => $this->resource->breed,
            'gender' => $this->resource->gender,
            'color' => $this->resource->color,
            'weight_grams' => $this->resource->weight_grams,
            'size_cm' => $this->resource->size_cm,
            'date_of_birth' => $this->resource->date_of_birth,
            'origin_country' => $this->resource->origin_country,
            'is_boarding_animal' => $this->resource->is_boarding_animal,
            'intake_date' => $this->resource->intake_date,
            'character_description' => $this->resource->character_description,
            'contract_notes' => $this->resource->contract_notes,
            'internal_notes' => $this->resource->internal_notes,
            // Tab 2: Health & Identification
            'is_neutered' => $this->resource->is_neutered,
            'health_description' => $this->resource->health_description,
            'tasso_id' => $this->resource->tasso_id,
            'findefix_id' => $this->resource->findefix_id,
            'trace_id' => $this->resource->trace_id,
            // Tab 3: Placement, Contract & Costs
            'assigned_agent_id' => $this->resource->assigned_agent_id,
            'origin_organization' => $this->resource->origin_organization,
            'owner_id' => $this->resource->owner_id,
            'adoption_fee' => $this->resource->adoption_fee,
            'monthly_boarding_cost' => $this->resource->monthly_boarding_cost,
            'monthly_sponsorship' => $this->resource->monthly_sponsorship,
            'sponsor_id' => $this->resource->sponsor_id,
            'sponsor_external' => $this->resource->sponsor_external,
            // Tab 4: Organization, Marketing & Status
            'current_location' => $this->resource->current_location,
            'alternate_transport_trace' => $this->resource->alternate_transport_trace,
            'alternate_arrival_location' => $this->resource->alternate_arrival_location,
            'do_publish' => $this->resource->do_publish,
            'publish_description' => $this->resource->publish_description,
            'application_url' => $this->resource->application_url,
            'is_deceased' => $this->resource->is_deceased,
            'date_of_death' => $this->resource->date_of_death,
            'compatibilities' => $this->whenLoaded('compatibilities', fn () => $this->resource->compatibilities->pluck('value')->values()->all(), []
            ),
            'personality_traits' => $this->whenLoaded('personalityTraits', fn () => $this->resource->personalityTraits->pluck('value')->values()->all(), []
            ),
            // Metadata
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
            // Relations (only included when eager-loaded)
            'animal_type' => $this->whenLoaded('animalType', fn ($v) => new AnimalTypeResource($v)),
            'assigned_agent' => $this->whenLoaded('assignedAgent', fn ($v) => $v ? new PersonBaseResource($v) : null),
            'owner' => $this->whenLoaded('owner', fn ($v) => $v ? new PersonBaseResource($v) : null),
            'sponsor' => $this->whenLoaded('sponsor', fn ($v) => $v ? new PersonBaseResource($v) : null),
            'adoptions' => AdoptionBaseResource::collection($this->whenLoaded('adoptions')),
            'vaccinations' => AnimalVaccinationResource::collection($this->whenLoaded('vaccinations')),
            'medical_tests' => AnimalMedicalTestResource::collection($this->whenLoaded('medicalTests')),
        ];
    }
}
