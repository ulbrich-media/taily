// Mirrors: api/app/Http/Resources/PreInspectionBaseResource.php
//          api/app/Http/Resources/PreInspectionListResource.php
//          api/app/Http/Resources/PreInspectionDetailResource.php

import type { AnimalTypeResource } from './animal-types'
import type { PersonBaseResource } from './people'

export type PreInspectionVerdict = 'pending' | 'approved' | 'rejected'

// Base scalar fields (no relations).
interface PreInspectionBaseResource {
  id: string
  person_id: string
  animal_type_id: string
  inspector_id: string | null
  verdict: PreInspectionVerdict
  notes: string
  token: string | null
  expires_at: string | null
  submitted_at: string | null
  created_at: string
  updated_at: string
}

// Returned by GET /pre-inspections (index) and GET /pre-inspections/:id (show),
// POST (store), PUT (update).
// Relations loaded: person, animalType, inspector, accessTokens.
export interface PreInspectionResource extends PreInspectionBaseResource {
  status: PreInspectionVerdict
  submission_url: string | null
  person: PersonBaseResource
  animal_type: AnimalTypeResource
  inspector: PersonBaseResource | null
}
