// ---------------------------------------------------------------------------
// Response types (returned by the API)
// ---------------------------------------------------------------------------

import type { AdoptionListResource, AdoptionDetailResource } from '@/api/types/adoptions'

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
  animal_id?: string
  applicant_id?: string
  mediator_id?: string | null
  status?: 'pending' | 'in_progress' | 'canceled' | 'done'
  canceled_at?: string | null
  canceled_reason?: string
  internal_notes?: string
  application_notes?: string
  pre_inspection_notes?: string
  contract_sent_at?: string | null
  contract_signed?: boolean
  contract_signed_at?: string | null
  transport_id?: string | null
  handed_over_at?: string | null
}
