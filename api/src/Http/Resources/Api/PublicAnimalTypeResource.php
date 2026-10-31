<?php

namespace Taily\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Taily\Support\CustomFields\CustomFieldDefinition;
use Taily\Support\CustomFields\CustomFieldDefinitions;

class PublicAnimalTypeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'title' => $this->resource->title,
            'vaccinations' => PublicAnimalVaccinationTemplateResource::collection($this->whenLoaded('vaccinations')),
            'medical_tests' => PublicMedicalTestTemplateResource::collection($this->whenLoaded('medicalTests')),
            'custom_fields' => array_map(fn (CustomFieldDefinition $field) => array_filter([
                'key' => $field->key,
                'label' => $field->label(),
                'type' => $field->type(),
                'options' => $field->options() ?: null,
                'minimum' => $field->schema['minimum'] ?? null,
                'maximum' => $field->schema['maximum'] ?? null,
            ], fn ($value) => $value !== null), app(CustomFieldDefinitions::class)->publicAnimalFields($this->resource->id)),
        ];
    }
}
