// Mirrors: api/app/Http/Resources/AdoptionBaseResource.php
//          api/app/Http/Resources/AdoptionListResource.php
//          api/app/Http/Resources/AdoptionDetailResource.php

import type { AnimalListResource, AnimalDetailResource } from './animals'
import type {
  PersonBaseResource,
  PersonListResource,
  PersonDetailResource,
} from './people'

export type AdoptionStepStatus = 'not_started' | 'in_progress' | 'finished'
export type AdoptionOverallStatus = 'in_progress' | 'completed' | 'rejected'
export type AdoptionPreInspectionResult =
  | 'not_conducted'
  | 'approved'
  | 'rejected'

// Scalar fields shared by list and detail resources.
// Use this when an Adoption is nested inside another resource (e.g. AnimalDetailResource).
export interface AdoptionBaseResource {
  id: string
  // Foreign keys
  animal_id: string
  mediator_id: string
  applicant_id: string
  inspector_id: string | null
  // Pre-inspection
  pre_inspection_result: AdoptionPreInspectionResult
  pre_inspection_summary: string
  // Contract
  contract_sent_at: string | null
  contract_signed: boolean
  // Transfer
  transfer_planned_at: string | null
  transferred_at: string | null
  // Computed status attributes
  pre_inspection_status: AdoptionStepStatus
  contract_status: AdoptionStepStatus
  transfer_status: AdoptionStepStatus
  overall_status: AdoptionOverallStatus
  // Metadata
  created_at: string
  updated_at: string
}

// Returned by GET /adoptions (index).
// Relations loaded: animal + animalType + media, mediator + media, applicant + media.
export interface AdoptionListResource extends AdoptionBaseResource {
  animal: AnimalListResource
  mediator: PersonListResource | null
  applicant: PersonListResource
}

// Returned by GET /adoptions/:id (show), POST /adoptions (store), PUT /adoptions/:id (update).
// Relations loaded: same as list plus inspector.
export interface AdoptionDetailResource extends AdoptionBaseResource {
  animal: AnimalDetailResource
  mediator: PersonListResource | null
  applicant: PersonDetailResource
  inspector: PersonBaseResource | null
}
