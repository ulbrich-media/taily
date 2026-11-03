<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Taily\Support\FrontendUriBuilder;

class PreInspectionListResource extends PreInspectionBaseResource
{
    public function toArray(Request $request): array
    {
        $token = $this->activeToken();

        return array_merge(parent::toArray($request), [
            'status' => $this->resource->status,
            'submission_url' => $token ? FrontendUriBuilder::inspect($token->token) : null,
            'inspector' => $this->whenLoaded('inspector', fn ($v) => $v ? new PersonBaseResource($v) : null),
            // Enough of the adoption to tell earlier pre-inspections apart.
            'adoption' => $this->whenLoaded('adoption', fn ($adoption) => [
                'id' => $adoption->id,
                'applicant_person_id' => $adoption->applicant_person_id,
                'applicant_full_name' => $adoption->applicant_full_name,
                'animal' => $adoption->animal ? [
                    'id' => $adoption->animal->id,
                    'name' => $adoption->animal->name,
                    'animal_type_id' => $adoption->animal->animal_type_id,
                    'animal_type' => $adoption->animal->animalType?->title,
                ] : null,
            ]),
        ]);
    }
}
