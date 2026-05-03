<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PersonBaseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'first_name' => $this->resource->first_name,
            'last_name' => $this->resource->last_name,
            'full_name' => $this->resource->full_name,
            'organization_id' => $this->resource->organization_id,
            'organization_role' => $this->resource->organization_role,
            'email' => $this->resource->email,
            'date_of_birth' => $this->resource->date_of_birth,
            'street_line' => $this->resource->street_line,
            'street_line_additional' => $this->resource->street_line_additional,
            'postal_code' => $this->resource->postal_code,
            'city' => $this->resource->city,
            'country_code' => $this->resource->country_code,
            'phone' => $this->resource->phone,
            'mobile' => $this->resource->mobile,
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
            'roles' => $this->resource->roles,
            // Relations (only included when eager-loaded)
            'organization' => $this->whenLoaded('organization', fn ($v) => $v ? new OrganizationResource($v) : null),
            'inspector_animal_types' => AnimalTypeResource::collection($this->whenLoaded('inspectorAnimalTypes')),
            'mediator_animal_types' => AnimalTypeResource::collection($this->whenLoaded('mediatorAnimalTypes')),
            'foster_animal_types' => AnimalTypeResource::collection($this->whenLoaded('fosterAnimalTypes')),
        ];
    }
}
