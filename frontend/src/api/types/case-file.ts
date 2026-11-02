// Mirrors: api/src/Support/CaseFile/CaseFileService.php (present())
//          api/src/Support/CaseFile/Checklist.php (toArray())

export type AdoptionStep =
  'application' | 'pre_inspection' | 'contract' | 'transport' | 'handover'

export const ADOPTION_STEPS: AdoptionStep[] = [
  'application',
  'pre_inspection',
  'contract',
  'transport',
  'handover',
]

export const ADOPTION_STEP_LABELS: Record<AdoptionStep, string> = {
  application: 'Bewerbung',
  pre_inspection: 'Vorkontrolle',
  contract: 'Vertrag',
  transport: 'Transport',
  handover: 'Übergabe',
}

export type CaseFileFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'select'
  | 'radio'
  | 'date'
  | 'email'
  | 'phone'
  | 'photo'
  | 'video'
  | 'document'
  | 'address'
  | 'info'

export interface CaseFileChoice {
  value: string
  label: string
}

export interface CaseFileFieldOptions {
  choices?: CaseFileChoice[]
  min?: number
  max?: number
}

export interface CaseFileCondition {
  field: string
  equals?: unknown
  in?: unknown[]
}

export interface CaseFileAddress {
  street_line: string
  street_line_additional: string
  postal_code: string
  city: string
  country_code: string
}

export type ChecklistItemStatus = 'missing' | 'awaiting_review' | 'done'

export interface CaseFileField {
  key: string
  label: string
  help: string
  type: CaseFileFieldType
  options: CaseFileFieldOptions | null
  built_in: boolean
  collect_at: AdoptionStep
  // The catalogue's default; null = optional.
  required_for: AdoptionStep | null
  // After overrides, contract fields and conditions.
  effective_required_for: AdoptionStep | null
  in_contract: boolean
  condition: CaseFileCondition | null
  applies: boolean
  requires_review: boolean
  visible_to_applicant: boolean
  visible_to_inspector: boolean
  value: unknown
  review_status: 'pending' | 'confirmed' | 'rejected' | null
  override: { required_for: AdoptionStep | null; waived: boolean } | null
  // Set when the field is required at some step.
  status: ChecklistItemStatus | null
  updated_at: string | null
}

export interface CaseFileGroup {
  id: string
  title: string
  intro: string
  fields: CaseFileField[]
}

export interface ChecklistItem {
  key: string
  label: string
  required_for: AdoptionStep
  status: ChecklistItemStatus
  // Where to fix it: the case file, or the animal or mediator record.
  subject?: 'case_file' | 'animal' | 'mediator'
}

export interface Checklist {
  step: AdoptionStep
  complete: boolean
  missing: number
  awaiting_review: number
  done: number
  items: ChecklistItem[]
}

// Returned by GET /adoptions/:id/case-file.
export interface CaseFileResource {
  groups: CaseFileGroup[]
  checklists: Record<AdoptionStep, Checklist>
}

// Returned by GET /transports/:id/checklist.
export interface TransportChecklistResource {
  complete: number
  total: number
  adoptions: {
    adoption_id: string
    animal: { id: string; name: string }
    applicant: { id: string; full_name: string }
    checklist: Checklist
  }[]
}
