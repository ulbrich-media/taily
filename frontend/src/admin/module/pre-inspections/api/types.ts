// ---------------------------------------------------------------------------
// Response types (returned by the API)
// ---------------------------------------------------------------------------

import type {
  PreInspectionResource,
  PreInspectionVerdict,
} from '@/api/types/pre-inspections'

/** Single pre-inspection. */
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
  adoption_id: string
  inspector_id?: string | null
}

export interface UpdatePreInspectionRequest {
  memo?: string | null
  verdict?: 'approved' | 'rejected' | null
}

export interface UpdateInspectorRequest {
  inspector_id: string | null
}

export type { PreInspectionVerdict }
