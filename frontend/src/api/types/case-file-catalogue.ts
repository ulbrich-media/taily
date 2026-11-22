// Mirrors: api/src/Http/Controllers/Internal/FieldCatalogueController.php (present())

import type {
  AdoptionStep,
  CaseFileCondition,
  CaseFileFieldOptions,
  CaseFileFieldType,
} from './case-file'

export interface CatalogueField {
  id: string
  key: string
  label: string
  help: string
  type: CaseFileFieldType
  options: CaseFileFieldOptions | null
  built_in: boolean
  collect_at: AdoptionStep
  required_for: AdoptionStep | null
  requires_review: boolean
  visible_to_applicant: boolean
  visible_to_inspector: boolean
  condition: CaseFileCondition | null
  archived_at: string | null
}

export interface CatalogueGroup {
  id: string
  title: string
  intro: string
  fields: CatalogueField[]
}

// Returned by GET /animal-types/:id/catalogue and every catalogue mutation.
export interface CatalogueResource {
  animal_type: { id: string; title: string }
  groups: CatalogueGroup[]
}
