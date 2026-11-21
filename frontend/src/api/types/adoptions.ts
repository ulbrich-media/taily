// Mirrors: api/src/Http/Resources/AdoptionBaseResource.php
//          api/src/Http/Resources/AdoptionListResource.php
//          api/src/Http/Resources/AdoptionDetailResource.php

import type { AnimalListResource, AnimalDetailResource } from './animals'
import type { PersonBaseResource, PersonListResource } from './people'
import type { TransportListResource } from '@/api/types/transports.ts'

export type AdoptionStepStatus = 'not_started' | 'pending' | 'finished'
// 'unconfirmed': a public application whose email isn't confirmed yet.
export type AdoptionStatus =
  'unconfirmed' | 'pending' | 'in_progress' | 'canceled' | 'done'

// Scalar fields shared by list and detail resources.
// Use this when an Adoption is nested inside another resource.
export interface AdoptionBaseResource {
  id: string
  // Foreign keys
  animal_id: string
  mediator_id: string | null
  // An optional reference to a Person Taily manages; never a data source.
  applicant_person_id: string | null
  transport_id: string | null
  // General status
  status: AdoptionStatus
  canceled_at: string | null
  canceled_reason: string
  // General notes
  notes: string
  // Pre-inspection step
  pre_inspection_notes: string
  // The mediator's confirmation that closes the step.
  pre_inspection_confirmed_at: string | null
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
  // The applicant's own data (ADR-018)
  applicant: AdoptionApplicant
  applicant_person?: PersonBaseResource | null
}

export interface AdoptionApplicant {
  person_id: string | null
  first_name: string
  last_name: string
  full_name: string
  // Stored lowercased; links the applicant's adoptions.
  email: string
  phone: string
  mobile: string
  date_of_birth: string | null
  street_line: string
  street_line_additional: string
  postal_code: string
  city: string
  country_code: string
}

// Returned by GET /adoptions (index).
export interface AdoptionListResource extends AdoptionBaseResource {
  animal: AnimalListResource
  mediator: PersonListResource | null
  applicant_person?: PersonListResource | null
}

export interface ContractFile {
  uuid: string
  name: string
  url: string
}

// Returned by GET /adoptions/{id}/contract-templates; `key` is the template id.
export interface ContractTemplate {
  key: string
  label: string
}

export type ContractSource = 'manual' | 'digital'

export type ContractSignerRole = 'mediator' | 'adopter'
export type ContractSigningStatus =
  | 'awaiting_mediator_signature'
  | 'awaiting_adopter_signature'
  | 'completed'
  | 'cancelled'
  | 'expired'

export interface ContractSigningProcessSigner {
  role: ContractSignerRole
  // When the latest invite mail went out; null if none was recorded.
  invited_at: string | null
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
  applicant_person?: PersonListResource | null
  contract_file: ContractFile | null
  // 'digital' = completed native signing flow (locked against manual edits),
  // 'manual' = confirmed by hand, null = no signed contract yet.
  contract_source: ContractSource | null
  contract_signing_process: ContractSigningProcess | null
  pre_inspection_confirmed_by: { id: string; name: string } | null
  transport: TransportListResource | null
}

// Returned by GET /adoptions/{id}/related: the applicant's other adoptions.
export interface RelatedAdoption {
  id: string
  status: AdoptionStatus
  created_at: string
  applicant: { full_name: string; email: string }
  animal: { id: string; name: string; animal_type: string | null } | null
  // Why it counts as the same applicant.
  matched_by: ('email' | 'person')[]
  pre_inspection_status: AdoptionStepStatus
  contract_signed: boolean
  handed_over_at: string | null
}
