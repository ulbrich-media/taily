// ---------------------------------------------------------------------------
// Response types (returned by the API)
// ---------------------------------------------------------------------------

import type {
  AdoptionListResource,
  AdoptionDetailResource,
  AdoptionPreInspectionResult,
} from '@/api/types/adoptions'

/** Single adoption (detail response shape). */
export type Adoption = AdoptionDetailResource
export type AdoptionsResponse = AdoptionListResource[]
export interface AdoptionResponse {
  message: string
  data: AdoptionDetailResource
}

// ---------------------------------------------------------------------------
// Request / input types (sent to the API — not resource shapes)
// ---------------------------------------------------------------------------

export interface CreateAdoptionRequest {
  animal_id: string
  applicant_id: string
  mediator_id: string | null
}

export interface UpdateAdoptionRequest {
  animal_id: string
  applicant_id: string
  mediator_id?: string | null
  inspector_id?: string | null
  pre_inspection_result?: AdoptionPreInspectionResult
  pre_inspection_summary?: string
  contract_sent_at?: string | null
  contract_signed?: boolean
  transfer_planned_at?: string | null
  transferred_at?: string | null
}
