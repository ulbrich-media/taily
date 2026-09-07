<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The status readout shown on the admin contract dialog. Deliberately thin —
 * cancellation UI, the audit-trail viewer, and resend/expiry are separate,
 * later issues.
 */
class ContractSigningProcessResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'status' => $this->resource->status,
            'created_at' => $this->resource->created_at,
            'completed_at' => $this->resource->completed_at,
            'terminated_at' => $this->resource->terminated_at,
            'signers' => $this->whenLoaded('signers', fn () => $this->resource->signers->map(fn ($signer) => [
                'role' => $signer->role,
                'signed_at' => $signer->signed_at,
                'full_name' => $signer->relationLoaded('person') ? $signer->person->full_name : null,
            ])->values()),
        ];
    }
}
