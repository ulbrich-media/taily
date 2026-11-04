// Mirrors: api/src/Http/Controllers/Internal/PublicApplicationController.php
//          api/src/Http/Controllers/Internal/ApplicantPortalController.php
//          api/src/Support/ApplicantPortal.php

import type {
  AdoptionStep,
  CaseFileField,
  CaseFileGroup,
  ChecklistItem,
} from '@/api/types/case-file'
import type { AdoptionStatus, AdoptionStepStatus } from '@/api/types/adoptions'

export interface ApplicantField extends CaseFileField {
  // Shown but not editable — the email the portal login is tied to.
  locked?: boolean
}

export interface ApplicantGroup extends Omit<CaseFileGroup, 'fields'> {
  fields: ApplicantField[]
}

export interface ApplicantAnimal {
  name: string
  animal_type: string | null
  picture_url: string | null
}

// GET /apply/{animal}
export interface ApplicationForm {
  animal: ApplicantAnimal & { is_reserved: boolean }
  accepts_applications: boolean
  groups: ApplicantGroup[]
  open: ChecklistItem[]
}

export interface PortalStep {
  step: AdoptionStep
  status: AdoptionStepStatus
  planned_at?: string | null
}

// GET /portal/adoptions/{id}. A canceled adoption has the base fields only.
export interface PortalAdoption {
  id: string
  status: AdoptionStatus
  created_at: string
  animal: ApplicantAnimal
  editable?: boolean
  current_step?: AdoptionStep
  steps?: PortalStep[]
  groups?: ApplicantGroup[]
  // Missing for the current step, among the applicant's own fields.
  open?: ChecklistItem[]
}

// GET /portal/adoptions
export interface PortalOverview {
  email: string
  adoptions: Pick<
    PortalAdoption,
    'id' | 'status' | 'created_at' | 'animal' | 'current_step' | 'editable'
  >[]
}

export interface SessionResponse {
  message?: string
  session_token: string
}
