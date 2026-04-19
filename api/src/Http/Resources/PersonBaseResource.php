<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PersonBaseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'organization_id' => $this->organization_id,
            'organization_role' => $this->organization_role,
            'email' => $this->email,
            'date_of_birth' => $this->date_of_birth,
            'street_line' => $this->street_line,
            'street_line_additional' => $this->street_line_additional,
            'postal_code' => $this->postal_code,
            'city' => $this->city,
            'country_code' => $this->country_code,
            'phone' => $this->phone,
            'mobile' => $this->mobile,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'roles' => $this->roles,
            // Relations (only included when eager-loaded)
            'organization' => $this->whenLoaded('organization', fn ($v) => $v ? new OrganizationResource($v) : null),
            'inspector_animal_types' => AnimalTypeResource::collection($this->whenLoaded('inspectorAnimalTypes')),
            'mediator_animal_types' => AnimalTypeResource::collection($this->whenLoaded('mediatorAnimalTypes')),
            'foster_animal_types' => AnimalTypeResource::collection($this->whenLoaded('fosterAnimalTypes')),
        ];
    }
}
