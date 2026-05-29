// Mirrors: api/src/Http/Resources/TransportListResource.php
//          api/src/Http/Resources/TransportDetailResource.php

export interface TransportAdoptionItem {
  id: string
  animal_id: string
  applicant_id: string
  animal_name: string | null
  applicant_name: string | null
}

export interface TransportBaseResource {
  id: string
  planned_at: string | null
  notes: string
  done_at: string | null
  is_done: boolean
  created_at: string
  updated_at: string
}

export interface TransportListResource extends TransportBaseResource {
  animal_count: number
}

export interface TransportDetailResource extends TransportBaseResource {
  adoptions: TransportAdoptionItem[]
}
