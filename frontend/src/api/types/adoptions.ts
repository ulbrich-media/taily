// Mirrors: api/src/Http/Resources/AdoptionBaseResource.php
//          api/src/Http/Resources/AdoptionListResource.php
//          api/src/Http/Resources/AdoptionDetailResource.php

import type { AnimalListResource, AnimalDetailResource } from './animals'
import type { PersonListResource, PersonDetailResource } from './people'
import type { TransportListResource } from '@/api/types/transports.ts'

export type AdoptionStepStatus =
  'not_started' | 'pending' | 'in_progress' | 'finished'
export type AdoptionStatus = 'pending' | 'in_progress' | 'canceled' | 'done'

// Scalar fields shared by list and detail resources.
// Use this when an Adoption is nested inside another resource.
export interface AdoptionBaseResource {
  id: string
  // Foreign keys
  animal_id: string
  mediator_id: string | null
  applicant_id: string
  transport_id: string | null
  // General status
  status: AdoptionStatus
  canceled_at: string | null
  canceled_reason: string
  // General notes
  notes: string
  // Pre-inspection step
  pre_inspection_notes: string
  // Contract step
  contract_signed: boolean
  contract_signed_at: string | null
  // Handover step
  handed_over_at: string | null
  // Computed step statuses
  pre_inspection_status: AdoptionStepStatus
  contract_status: AdoptionStepStatus
  transport_status: AdoptionStepStatus
  handover_status: AdoptionStepStatus
  // Metadata
  created_at: string
  updated_at: string
}

// Returned by GET /adoptions (index).
export interface AdoptionListResource extends AdoptionBaseResource {
  animal: AnimalListResource
  mediator: PersonListResource | null
  applicant: PersonListResource
}

export interface ContractFile {
  uuid: string
  name: string
  url: string
}

// Returned by GET /adoptions/:id (show), POST /adoptions (store), PATCH /adoptions/:id (update).
export interface AdoptionDetailResource extends AdoptionBaseResource {
  animal: AnimalDetailResource
  mediator: PersonListResource | null
  applicant: PersonDetailResource
  contract_file: ContractFile | null
  transport: TransportListResource | null
}
