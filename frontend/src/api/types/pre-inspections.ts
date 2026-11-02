// Mirrors: api/src/Http/Resources/PreInspectionBaseResource.php
//          api/src/Http/Resources/PreInspectionListResource.php

import type { PersonBaseResource } from './people'

// null while the inspector hasn't submitted yet.
export type PreInspectionVerdict = 'approved' | 'rejected' | null

interface PreInspectionBaseResource {
  id: string
  adoption_id: string
  inspector_id: string | null
  verdict: PreInspectionVerdict
  memo: string
  token: string | null
  expires_at: string | null
  submitted_at: string | null
  created_at: string
  updated_at: string
}

// Returned by GET /pre-inspections (index, filtered by adoption or person),
// GET /pre-inspections/:id, POST, PUT.
export interface PreInspectionResource extends PreInspectionBaseResource {
  status: 'pending' | 'approved' | 'rejected'
  submission_url: string | null
  inspector: PersonBaseResource | null
  adoption: {
    id: string
    applicant_id: string
    animal: {
      id: string
      name: string
      animal_type_id: string
      animal_type: string | null
    } | null
  }
}
