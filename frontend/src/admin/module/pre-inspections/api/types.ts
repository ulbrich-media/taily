// ---------------------------------------------------------------------------
// Response types (returned by the API)
// ---------------------------------------------------------------------------

import type {
  PreInspectionResource,
  PreInspectionVerdict,
} from '@/api/types/pre-inspections'

/** Single pre-inspection (backwards compat alias). */
export type PreInspection = PreInspectionResource
export type PreInspectionsResponse = PreInspectionResource[]
export interface PreInspectionResponse {
  message: string
  data: PreInspectionResource
}
export interface DeletePreInspectionResponse {
  message: string
}

// ---------------------------------------------------------------------------
// Request / input types (sent to the API — not resource shapes)
// ---------------------------------------------------------------------------

export interface CreatePreInspectionRequest {
  person_id: string
  animal_type_id: string
  inspector_id?: string | null
}

export interface UpdatePreInspectionRequest {
  inspector_id?: string | null
  notes?: string | null
  verdict?: PreInspectionVerdict
}
