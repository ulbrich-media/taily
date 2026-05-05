<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdoptionBaseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            // Foreign keys
            'animal_id' => $this->resource->animal_id,
            'mediator_id' => $this->resource->mediator_id,
            'applicant_id' => $this->resource->applicant_id,
            'transport_id' => $this->resource->transport_id,
            // General status
            'status' => $this->resource->status,
            'canceled_at' => $this->resource->canceled_at,
            'canceled_reason' => $this->resource->canceled_reason,
            // Application step
            'application_notes' => $this->resource->application_notes,
            // Pre-inspection step
            'pre_inspection_notes' => $this->resource->pre_inspection_notes,
            // Contract step
            'contract_sent_at' => $this->resource->contract_sent_at,
            'contract_signed' => $this->resource->contract_signed,
            'contract_signed_at' => $this->resource->contract_signed_at,
            // Handover step
            'handed_over_at' => $this->resource->handed_over_at,
            // Computed step statuses
            'contract_status' => $this->resource->contract_status,
            'transport_status' => $this->resource->transport_status,
            'handover_status' => $this->resource->handover_status,
            // Metadata
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
            // Relations (only included when eager-loaded)
            'animal' => $this->whenLoaded('animal', fn ($a) => new AnimalBaseResource($a)),
            'mediator' => $this->whenLoaded('mediator', fn ($m) => new PersonBaseResource($m)),
            'applicant' => $this->whenLoaded('applicant', fn ($m) => new PersonBaseResource($m)),
        ];
    }
}
