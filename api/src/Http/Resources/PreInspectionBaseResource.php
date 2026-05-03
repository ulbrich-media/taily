<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Taily\Models\AccessToken;

class PreInspectionBaseResource extends JsonResource
{
    protected function activeToken(): ?AccessToken
    {
        if ($this->resource->verdict !== 'pending') {
            return null;
        }

        return $this->resource->accessTokens
            ->filter(fn ($t) => ! $t->isExpired())
            ->first();
    }

    public function toArray(Request $request): array
    {
        $token = $this->resource->activeToken();

        return [
            'id' => $this->resource->id,
            'person_id' => $this->resource->person_id,
            'animal_type_id' => $this->resource->animal_type_id,
            'inspector_id' => $this->resource->inspector_id,
            'verdict' => $this->resource->verdict,
            'notes' => $this->resource->notes,
            'token' => $token?->token,
            'expires_at' => $token?->expires_at,
            'submitted_at' => $this->resource->submitted_at,
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
        ];
    }
}
