// Mirrors: api/src/Http/Controllers/Internal/ContractTemplateController.php (present())
// and ContractTemplateService::fieldOptions().

export const CONTRACT_SECTIONS = ['animal', 'mediator', 'adopter'] as const
export type ContractSection = (typeof CONTRACT_SECTIONS)[number]

export interface ContractTemplateField {
  key: string
  // Required fields block generation and are on the contract checklist.
  required: boolean
}

export interface ContractTemplateResource {
  id: string
  name: string
  title: string
  body: string
  animal_type: { id: string; title: string }
  animal_fields: ContractTemplateField[]
  mediator_fields: ContractTemplateField[]
  adopter_fields: ContractTemplateField[]
  archived_at: string | null
  updated_at: string
}

export interface ContractFieldOption {
  key: string
  label: string
}

export interface ContractFieldOptions {
  animal: ContractFieldOption[]
  mediator: ContractFieldOption[]
  // The printable catalogue fields of each animal type.
  adopter: { animal_type_id: string; fields: ContractFieldOption[] }[]
}
