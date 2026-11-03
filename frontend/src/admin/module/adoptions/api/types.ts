// ---------------------------------------------------------------------------
// Response types (returned by the API)
// ---------------------------------------------------------------------------

import type {
  AdoptionListResource,
  AdoptionDetailResource,
  AdoptionStatus,
} from '@/api/types/adoptions'

/** Single adoption (detail response shape). */
export type Adoption = AdoptionDetailResource
export type AdoptionsResponse = AdoptionListResource[]
export interface AdoptionResponse {
  message: string
  data: AdoptionDetailResource
}

export interface UpdateContractRequest {
  contract_signed: boolean
  contract_signed_at?: string | null
  file?: File | null
  remove_file?: boolean
}

export interface GenerateContractResponse {
  url: string
}

// ---------------------------------------------------------------------------
// Request / input types (sent to the API — not resource shapes)
// ---------------------------------------------------------------------------

// Either a Person whose data is copied once, or the applicant's data.
export interface CreateAdoptionRequest {
  animal_id: string
  mediator_id: string | null
  applicant_person_id?: string
  applicant_first_name?: string
  applicant_last_name?: string
  applicant_email?: string
  applicant_phone?: string
}

export interface UpdateAdoptionRequest {
  animal_id?: string
  // Links or unlinks a Person; the applicant's data stays as it is.
  applicant_person_id?: string | null
  mediator_id?: string | null
  status?: AdoptionStatus
  canceled_reason?: string
  notes?: string
  pre_inspection_notes?: string
  transport_id?: string | null
  handed_over_at?: string | null
}
