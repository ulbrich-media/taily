import type {
  AdoptionStep,
  CaseFileAddress,
  CaseFileField,
} from '@/api/types/case-file'
import { ADOPTION_STEP_LABELS } from '@/api/types/case-file'

export type CaseFileValues = Record<string, unknown>

// What formatting needs to know about a field — also what the public
// pre-inspection page receives.
type FieldShape = Pick<CaseFileField, 'type' | 'options'>

/**
 * Mirrors ChecklistCalculator::applies() for live forms: a conditional field
 * only applies while its controlling field applies and holds the expected
 * value. The animal-type check already happened on the server — fields for
 * other animal types are never sent.
 */
export function fieldApplies(
  field: CaseFileField,
  values: CaseFileValues,
  fieldsByKey: Map<string, CaseFileField>,
  visited: Set<string> = new Set()
): boolean {
  const condition = field.condition
  if (!condition) return true

  const controller = fieldsByKey.get(condition.field)
  if (!controller || visited.has(field.key)) return false

  const next = new Set(visited).add(field.key)
  if (!fieldApplies(controller, values, fieldsByKey, next)) return false

  const value = values[controller.key]
  if (condition.in !== undefined) return condition.in.includes(value)
  return condition.equals !== undefined && value === condition.equals
}

export function isPresent(field: FieldShape, value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (field.type === 'address') {
    const address = value as Partial<CaseFileAddress>
    return (
      !!address.street_line?.trim() &&
      !!address.postal_code?.trim() &&
      !!address.city?.trim()
    )
  }
  if (typeof value === 'string') return value.trim() !== ''
  if (Array.isArray(value)) return value.length > 0
  return true
}

export function isFileField(field: FieldShape): boolean {
  return (
    field.type === 'photo' ||
    field.type === 'video' ||
    field.type === 'document'
  )
}

/** Fields the mediator can edit in the prototype (no file uploads yet). */
export function isEditable(field: CaseFileField): boolean {
  return field.type !== 'info' && !isFileField(field)
}

export function formatValue(field: FieldShape, value: unknown): string {
  if (!isPresent(field, value)) return ''

  switch (field.type) {
    case 'boolean':
      return value ? 'Ja' : 'Nein'
    case 'select':
    case 'radio':
      return (
        field.options?.choices?.find((choice) => choice.value === value)
          ?.label ?? String(value)
      )
    case 'date': {
      const [year, month, day] = String(value).split('-')
      return `${day}.${month}.${year}`
    }
    case 'address': {
      const address = value as CaseFileAddress
      return [
        [address.street_line, address.street_line_additional]
          .filter(Boolean)
          .join(', '),
        [address.postal_code, address.city].filter(Boolean).join(' '),
        address.country_code,
      ]
        .filter(Boolean)
        .join(', ')
    }
    default:
      return String(value)
  }
}

/**
 * Turns the form state into what the API expects: numbers as numbers,
 * empty inputs as null.
 */
export function toApiValue(field: CaseFileField, value: unknown): unknown {
  if (value === '' || value === undefined) return null
  if (field.type === 'integer' || field.type === 'number') {
    const number = Number(value)
    return Number.isNaN(number) ? value : number
  }
  return value
}

export function requirementLabel(field: CaseFileField): string {
  const step = field.effective_required_for
  if (!field.applies) return 'Trifft nicht zu'
  if (field.override?.waived) return 'Für diese Vermittlung nicht nötig'
  if (!step) return 'Optional'
  return `Pflicht ab ${stepLabel(step)}`
}

export function stepLabel(step: AdoptionStep): string {
  return ADOPTION_STEP_LABELS[step]
}
