// Mirrors: api/src/Http/Resources/TransportListResource.php
//          api/src/Http/Resources/TransportDetailResource.php

import type { AdoptionListResource } from '@/api/types/adoptions.ts'
import type { PersonListResource } from '@/api/types/people.ts'

export interface TransportBaseResource {
  id: string
  name: string
  planned_at: string | null
  notes: string
  done_at: string | null
  is_done: boolean
  responsible_id: string | null
  responsible: PersonListResource | null
  transporter: string
  created_at: string
  updated_at: string
}

export interface TransportDetailResource extends TransportBaseResource {
  adoptions: AdoptionListResource[]
}

export interface TransportListResource extends TransportBaseResource {
  adoptions: AdoptionListResource[]
}
