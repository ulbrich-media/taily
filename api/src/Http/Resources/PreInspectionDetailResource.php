<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Taily\Support\FrontendUriBuilder;

class PreInspectionDetailResource extends PreInspectionBaseResource
{
    public function toArray(Request $request): array
    {
        $token = $this->resource->activeToken();

        return array_merge(parent::toArray($request), [
            'status' => $this->resource->status,
            'submission_url' => $token ? FrontendUriBuilder::inspect($token->token) : null,
            'person' => $this->whenLoaded('person', fn ($v) => new PersonBaseResource($v)),
            'animal_type' => $this->whenLoaded('animalType', fn ($v) => new AnimalTypeResource($v)),
            'inspector' => $this->whenLoaded('inspector', fn ($v) => $v ? new PersonBaseResource($v) : null),
        ]);
    }
}
