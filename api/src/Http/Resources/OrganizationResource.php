<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrganizationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'name' => $this->resource->name,
            'email' => $this->resource->email,
            'street_line' => $this->resource->street_line,
            'street_line_additional' => $this->resource->street_line_additional,
            'postal_code' => $this->resource->postal_code,
            'city' => $this->resource->city,
            'country_code' => $this->resource->country_code,
            'phone' => $this->resource->phone,
            'mobile' => $this->resource->mobile,
            'people_count' => $this->resource->when(isset($this->resource->people_count), fn () => $this->resource->people_count),
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
        ];
    }
}
