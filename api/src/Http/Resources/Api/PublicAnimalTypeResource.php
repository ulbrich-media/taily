<?php

namespace Taily\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicAnimalTypeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'title' => $this->resource->title,
            'vaccinations' => PublicAnimalVaccinationTemplateResource::collection($this->whenLoaded('vaccinations')),
            'medical_tests' => PublicMedicalTestTemplateResource::collection($this->whenLoaded('medicalTests')),
        ];
    }
}
