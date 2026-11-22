import type {
  ContractFieldOption,
  ContractFieldOptions,
  ContractSection,
  ContractTemplateField,
  ContractTemplateResource,
} from '@/api/types/contract-templates'
import type { ContractTemplateRequest } from './api/requests'

export type ContractTemplateFormData = ContractTemplateRequest

export function toFormData(
  template?: ContractTemplateResource
): ContractTemplateFormData {
  return {
    name: template?.name ?? '',
    title: template?.title ?? 'Schutzvertrag',
    body: template?.body ?? '',
    animal_type_id: template?.animal_type.id ?? '',
    animal_fields: template?.animal_fields ?? [],
    mediator_fields: template?.mediator_fields ?? [],
    adopter_fields: template?.adopter_fields ?? [],
  }
}

/**
 * "3 Felder, 2 davon Pflicht" — the summary of a template's sections.
 */
export function fieldSummary(fields: ContractTemplateField[]): string {
  const required = fields.filter((field) => field.required).length
  const total = `${fields.length} ${fields.length === 1 ? 'Feld' : 'Felder'}`
  return required === 0 ? total : `${total}, ${required} Pflicht`
}

export const SECTION_LABELS: Record<ContractSection, string> = {
  animal: 'Tier',
  mediator: 'Vermittler:in',
  adopter: 'Adoptant:in',
}

export const SECTION_DESCRIPTIONS: Record<ContractSection, string> = {
  animal: 'Angaben aus dem Tierprofil.',
  mediator: 'Angaben aus dem Profil der Vermittler:in.',
  adopter:
    'Angaben aus der Vermittlung – die Felder der Angaben dieser Tierart.',
}

/**
 * The catalogue fields a template for the given animal type can print.
 * Without a type, nothing.
 */
export function adopterOptions(
  options: ContractFieldOptions,
  animalTypeId: string
): ContractFieldOption[] {
  return (
    options.adopter.find((entry) => entry.animal_type_id === animalTypeId)
      ?.fields ?? []
  )
}

/**
 * Every label a key can have, for showing a chosen field — also one that is
 * no longer available for the current animal type.
 */
export function fieldLabel(
  options: ContractFieldOptions,
  section: ContractSection,
  key: string
): string | undefined {
  const pool =
    section === 'adopter'
      ? options.adopter.flatMap((entry) => entry.fields)
      : options[section]
  return pool.find((option) => option.key === key)?.label
}
