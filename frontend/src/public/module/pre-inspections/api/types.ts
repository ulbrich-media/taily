// Mirrors: api/src/Http/Controllers/Internal/PreInspectionSubmissionController.php

import type {
  CaseFileFieldType,
  CaseFileFieldOptions,
} from '@/api/types/case-file'

export interface PublicInspectionPerson {
  full_name: string
  street_line?: string
  street_line_additional?: string
  postal_code?: string
  city?: string
  country_code?: string
}

export interface PublicInspectionField {
  key: string
  label: string
  type: CaseFileFieldType
  options: CaseFileFieldOptions | null
  value: unknown
}

export interface PublicInspection {
  id: string
  person: PublicInspectionPerson
  animal: {
    name: string | null
    animal_type: string | null
    breed: string | null
  }
  // Only the Case File fields marked visible to inspectors.
  case_file: {
    id: string
    title: string
    fields: PublicInspectionField[]
  }[]
}

export interface SubmitInspectionRequest {
  verdict: 'approved' | 'rejected'
  memo?: string | null
}
