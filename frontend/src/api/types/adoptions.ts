// Mirrors: api/src/Http/Resources/AdoptionBaseResource.php
//          api/src/Http/Resources/AdoptionListResource.php
//          api/src/Http/Resources/AdoptionDetailResource.php

import type { AnimalListResource, AnimalDetailResource } from './animals'
import type { PersonListResource, PersonDetailResource } from './people'
import type { TransportListResource } from '@/api/types/transports.ts'

export type AdoptionStepStatus = 'not_started' | 'pending' | 'finished'
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

// Returned by GET /adoptions/contract-templates.
export interface ContractTemplate {
  key: string
  label: string
}

export type ContractSignerRole = 'mediator' | 'adopter'
export type ContractSigningStatus =
  | 'awaiting_mediator_signature'
  | 'awaiting_adopter_signature'
  | 'completed'
  | 'cancelled'
  | 'expired'

export interface ContractSigningProcessSigner {
  role: ContractSignerRole
  signed_at: string | null
  full_name: string | null
  expires_at: string | null
}

// Mirrors: api/src/Http/Resources/ContractSigningProcessResource.php
export interface ContractSigningProcess {
  id: string
  status: ContractSigningStatus
  created_at: string
  completed_at: string | null
  terminated_at: string | null
  signers: ContractSigningProcessSigner[]
}

// Returned by GET /adoptions/:id (show), POST /adoptions (store), PATCH /adoptions/:id (update).
export interface AdoptionDetailResource extends AdoptionBaseResource {
  animal: AnimalDetailResource
  mediator: PersonListResource | null
  applicant: PersonDetailResource
  contract_file: ContractFile | null
  contract_signing_process: ContractSigningProcess | null
  transport: TransportListResource | null
}
