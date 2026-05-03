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
            'inspector_id' => $this->resource->inspector_id,
            // Pre-inspection
            'pre_inspection_result' => $this->resource->pre_inspection_result,
            'pre_inspection_summary' => $this->resource->pre_inspection_summary,
            // Contract
            'contract_sent_at' => $this->resource->contract_sent_at,
            'contract_signed' => $this->resource->contract_signed,
            // Transfer
            'transfer_planned_at' => $this->resource->transfer_planned_at,
            'transferred_at' => $this->resource->transferred_at,
            // Computed status attributes
            'pre_inspection_status' => $this->resource->pre_inspection_status,
            'contract_status' => $this->resource->contract_status,
            'transfer_status' => $this->resource->transfer_status,
            'overall_status' => $this->resource->overall_status,
            // Metadata
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
            // Relations (only included when eager-loaded)
            'animal' => $this->whenLoaded('animal', fn ($a) => new AnimalBaseResource($a)),
            'mediator' => $this->whenLoaded('mediator', fn ($m) => new PersonBaseResource($m)),
            'applicant' => $this->whenLoaded('applicant', fn ($m) => new PersonBaseResource($m)),
            'inspector' => $this->whenLoaded('inspector', fn ($m) => new PersonBaseResource($m)),
        ];
    }
}
