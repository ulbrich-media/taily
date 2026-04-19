<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Taily\Models\AccessToken;

class PreInspectionBaseResource extends JsonResource
{
    protected function activeToken(): ?AccessToken
    {
        if ($this->verdict !== 'pending') {
            return null;
        }

        return $this->accessTokens
            ->filter(fn ($t) => ! $t->isExpired())
            ->first();
    }

    public function toArray(Request $request): array
    {
        $token = $this->activeToken();

        return [
            'id' => $this->id,
            'person_id' => $this->person_id,
            'animal_type_id' => $this->animal_type_id,
            'inspector_id' => $this->inspector_id,
            'verdict' => $this->verdict,
            'notes' => $this->notes,
            'token' => $token?->token,
            'expires_at' => $token?->expires_at,
            'submitted_at' => $this->submitted_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
