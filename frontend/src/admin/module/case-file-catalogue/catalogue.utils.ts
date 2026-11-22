import type { AdoptionStep, CaseFileFieldType } from '@/api/types/case-file'
import { ADOPTION_STEP_LABELS } from '@/api/types/case-file'
import type {
  CatalogueField,
  CatalogueGroup,
} from '@/api/types/case-file-catalogue'
import type { FieldDefinitionRequest } from './api/requests'

export const FIELD_TYPE_LABELS: Record<CaseFileFieldType, string> = {
  text: 'Text',
  textarea: 'Langer Text',
  number: 'Zahl',
  integer: 'Ganze Zahl',
  boolean: 'Ja/Nein',
  select: 'Auswahl (Liste)',
  radio: 'Auswahl (Optionen)',
  date: 'Datum',
  email: 'E-Mail',
  phone: 'Telefon',
  photo: 'Foto',
  video: 'Video',
  document: 'Dokument',
  address: 'Anschrift',
  info: 'Hinweis (kein Eingabefeld)',
}

// Types an admin can pick for a new field; addresses are built-in only.
export const CREATABLE_FIELD_TYPES = (
  Object.keys(FIELD_TYPE_LABELS) as CaseFileFieldType[]
).filter((type) => type !== 'address')

export function hasChoices(type: CaseFileFieldType): boolean {
  return type === 'select' || type === 'radio'
}

export function hasRange(type: CaseFileFieldType): boolean {
  return type === 'number' || type === 'integer'
}

/**
 * The fields a condition may depend on: active yes/no or choice fields that
 * stand above the given one (or, for a new field, anywhere in the catalogue
 * — a new field is appended at the end of its group).
 */
export function conditionCandidates(
  groups: CatalogueGroup[],
  current: { groupId: string; fieldId?: string }
): CatalogueField[] {
  const candidates: CatalogueField[] = []

  for (const group of groups) {
    for (const field of group.fields) {
      if (field.id === current.fieldId) return candidates
      if (field.archived_at) continue
      if (['boolean', 'select', 'radio'].includes(field.type)) {
        candidates.push(field)
      }
    }
    // A new field goes to the end of its group, so everything in and before
    // it counts as "above".
    if (!current.fieldId && group.id === current.groupId) return candidates
  }

  return candidates
}

/** A short line describing when a field is asked and needed. */
export function stepSummary(field: CatalogueField): string {
  if (field.type === 'info') {
    return `Ab ${ADOPTION_STEP_LABELS[field.collect_at]}`
  }
  const asked = `Erfragt ab ${ADOPTION_STEP_LABELS[field.collect_at]}`
  return field.required_for
    ? `${asked} · Pflicht ab ${ADOPTION_STEP_LABELS[field.required_for]}`
    : `${asked} · optional`
}

export function conditionSummary(
  field: CatalogueField,
  groups: CatalogueGroup[]
): string | null {
  const condition = field.condition
  if (!condition) return null

  const controller = groups
    .flatMap((group) => group.fields)
    .find((candidate) => candidate.key === condition.field)
  if (!controller) return `Nur wenn ${condition.field} …`

  if (condition.in) {
    const labels = condition.in.map(
      (value) =>
        controller.options?.choices?.find((choice) => choice.value === value)
          ?.label ?? String(value)
    )
    return `Nur wenn „${controller.label}“ = ${labels.join(' oder ')}`
  }

  return `Nur wenn „${controller.label}“ = ${condition.equals ? 'Ja' : 'Nein'}`
}

/** Moves an id one place up or down in a list, for the order buttons. */
export function moved(ids: string[], id: string, offset: -1 | 1): string[] {
  const index = ids.indexOf(id)
  const target = index + offset
  if (index < 0 || target < 0 || target >= ids.length) return ids
  const next = [...ids]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

// Sentinels: the select treats an empty value as "nothing chosen yet".
export const OPTIONAL = 'optional'
export const NO_CONDITION = 'none'

/** The state of the field form. */
export interface FieldDefinitionFormData {
  type: CaseFileFieldType
  key: string
  label: string
  help: string
  field_group_id: string
  collect_at: AdoptionStep
  required_for: AdoptionStep | typeof OPTIONAL
  requires_review: boolean
  visible_to_applicant: boolean
  visible_to_inspector: boolean
  choices: { value: string; label: string }[]
  min: string
  max: string
  // A field key, or NO_CONDITION.
  condition_field: string
  condition_equals: 'true' | 'false'
  condition_in: string[]
}

/** Turns a label into a key suggestion: "Größe des Gartens" → groesse_des_gartens. */
export function keyFromLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^[^a-z]+|_+$/g, '')
    .slice(0, 64)
}

export function toRequest(
  data: FieldDefinitionFormData,
  {
    isNew,
    builtIn,
    controllerType,
  }: {
    isNew: boolean
    builtIn: boolean
    // Type of the field the condition depends on, if any.
    controllerType?: CaseFileFieldType
  }
): FieldDefinitionRequest {
  const isInfo = data.type === 'info'
  const request: FieldDefinitionRequest = {
    label: data.label,
    help: isInfo ? '' : data.help,
    field_group_id: data.field_group_id,
    collect_at: data.collect_at,
    required_for:
      isInfo || data.required_for === OPTIONAL ? null : data.required_for,
    visible_to_applicant: data.visible_to_applicant,
    visible_to_inspector: data.visible_to_inspector,
  }

  if (isNew) {
    request.key = data.key
    request.type = data.type
  }

  if (builtIn) return request

  request.requires_review = isInfo ? false : data.requires_review
  request.options = hasChoices(data.type)
    ? { choices: data.choices }
    : hasRange(data.type)
      ? {
          ...(data.min !== '' && { min: Number(data.min) }),
          ...(data.max !== '' && { max: Number(data.max) }),
        }
      : null
  request.condition =
    data.condition_field === NO_CONDITION
      ? null
      : controllerType === 'boolean'
        ? {
            field: data.condition_field,
            equals: data.condition_equals === 'true',
          }
        : { field: data.condition_field, in: data.condition_in }

  return request
}
