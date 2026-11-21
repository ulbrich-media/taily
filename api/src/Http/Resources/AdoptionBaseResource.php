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
            'applicant_person_id' => $this->resource->applicant_person_id,
            'transport_id' => $this->resource->transport_id,
            // General status
            'status' => $this->resource->status,
            'canceled_at' => $this->resource->canceled_at,
            'canceled_reason' => $this->resource->canceled_reason,
            // General notes
            'notes' => $this->resource->notes,
            // Pre-inspection step
            'pre_inspection_notes' => $this->resource->pre_inspection_notes,
            'pre_inspection_confirmed_at' => $this->resource->pre_inspection_confirmed_at,
            // Contract step
            'contract_signed' => $this->resource->contract_signed,
            'contract_signed_at' => $this->resource->contract_signed_at,
            // Handover step
            'handed_over_at' => $this->resource->handed_over_at,
            // Computed step statuses
            'pre_inspection_status' => $this->resource->pre_inspection_status,
            'contract_status' => $this->resource->contract_status,
            'transport_status' => $this->resource->transport_status,
            'handover_status' => $this->resource->handover_status,
            // Metadata
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
            // Relations (only included when eager-loaded)
            'animal' => $this->whenLoaded('animal', fn ($a) => new AnimalBaseResource($a)),
            'mediator' => $this->whenLoaded('mediator', fn ($m) => new PersonBaseResource($m)),
            // The applicant's own data (ADR-018)
            'applicant' => $this->applicant(),
            'applicant_person' => $this->whenLoaded('applicantPerson', fn ($m) => $m ? new PersonBaseResource($m) : null),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function applicant(): array
    {
        $adoption = $this->resource;

        return [
            'person_id' => $adoption->applicant_person_id,
            'first_name' => $adoption->applicant_first_name,
            'last_name' => $adoption->applicant_last_name,
            'full_name' => $adoption->applicant_full_name,
            'email' => $adoption->applicant_email,
            'phone' => $adoption->applicant_phone,
            'mobile' => $adoption->applicant_mobile,
            'date_of_birth' => $adoption->applicant_date_of_birth?->format('Y-m-d'),
            'street_line' => $adoption->applicant_street_line,
            'street_line_additional' => $adoption->applicant_street_line_additional,
            'postal_code' => $adoption->applicant_postal_code,
            'city' => $adoption->applicant_city,
            'country_code' => $adoption->applicant_country_code,
        ];
    }
}
