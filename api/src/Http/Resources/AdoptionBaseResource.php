<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdoptionBaseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            // Foreign keys
            'animal_id' => $this->animal_id,
            'mediator_id' => $this->mediator_id,
            'applicant_id' => $this->applicant_id,
            'inspector_id' => $this->inspector_id,
            // Pre-inspection
            'pre_inspection_result' => $this->pre_inspection_result,
            'pre_inspection_summary' => $this->pre_inspection_summary,
            // Contract
            'contract_sent_at' => $this->contract_sent_at,
            'contract_signed' => $this->contract_signed,
            // Transfer
            'transfer_planned_at' => $this->transfer_planned_at,
            'transferred_at' => $this->transferred_at,
            // Computed status attributes
            'pre_inspection_status' => $this->pre_inspection_status,
            'contract_status' => $this->contract_status,
            'transfer_status' => $this->transfer_status,
            'overall_status' => $this->overall_status,
            // Metadata
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            // Relations (only included when eager-loaded)
            'animal' => $this->whenLoaded('animal', fn ($a) => new AnimalBaseResource($a)),
            'mediator' => $this->whenLoaded('mediator', fn ($m) => new PersonBaseResource($m)),
            'applicant' => $this->whenLoaded('applicant', fn ($m) => new PersonBaseResource($m)),
            'inspector' => $this->whenLoaded('inspector', fn ($m) => new PersonBaseResource($m)),
        ];
    }
}
