import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { FieldValues, Resolver } from 'react-hook-form'
import type { CaseFileField } from '@/api/types/case-file'
import {
  fieldApplies,
  isFileField,
  isPresent,
  toApiValue,
  type CaseFileValues,
} from './case-file.utils'

// What validation needs to know about a field; catalogue, Case File and
// applicant fields all carry this.
export type SchemaField = Pick<
  CaseFileField,
  'key' | 'type' | 'options' | 'condition'
>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

/** The first German message for a present value, or null if it is fine. */
function valueProblem(field: SchemaField, value: unknown): string | null {
  switch (field.type) {
    case 'number':
    case 'integer': {
      const { min, max } = field.options ?? {}
      if (typeof value !== 'number') return 'Bitte eine Zahl eingeben.'
      if (field.type === 'integer' && !Number.isInteger(value)) {
        return 'Bitte eine ganze Zahl eingeben.'
      }
      if (min !== undefined && value < min) {
        return `Der Wert muss mindestens ${min} sein.`
      }
      if (max !== undefined && value > max) {
        return `Der Wert darf höchstens ${max} sein.`
      }
      return null
    }
    case 'select':
    case 'radio':
      return field.options?.choices?.some((c) => c.value === value)
        ? null
        : 'Bitte eine der Optionen wählen.'
    case 'email':
      return EMAIL_PATTERN.test(String(value))
        ? null
        : 'Bitte eine gültige E-Mail-Adresse eingeben.'
    case 'date':
      return isValidDate(String(value))
        ? null
        : 'Bitte ein gültiges Datum eingeben.'
    default:
      return null
  }
}

/**
 * The zod schema of one field, derived from its configuration. It reads the
 * raw form state (strings from inputs) and checks what the server checks:
 * presence when `required`, then type, range, choices, e-mail and date.
 */
export function fieldSchema(field: SchemaField, required: boolean) {
  return z.unknown().superRefine((raw, ctx) => {
    const value = toApiValue(field, raw)
    if (!isPresent(field, value)) {
      if (required) {
        ctx.addIssue({ code: 'custom', message: 'Pflichtfeld fehlt.' })
      }
      return
    }
    const problem = valueProblem(field, value)
    if (problem) ctx.addIssue({ code: 'custom', message: problem })
  })
}

/**
 * The schema of a form's `values` for the current answers: one entry per
 * field that takes input and applies. `isRequired` decides per form whether a
 * missing value is an error. The server stays authoritative.
 */
export function caseFileSchema<F extends SchemaField>(
  fields: F[],
  values: CaseFileValues,
  fieldsByKey: Map<string, F>,
  isRequired: (field: F) => boolean = () => false
) {
  const shape: Record<string, ReturnType<typeof fieldSchema>> = {}
  for (const field of fields) {
    if (field.type === 'info' || isFileField(field)) continue
    if (!fieldApplies(field, values, fieldsByKey)) continue
    shape[field.key] = fieldSchema(field, isRequired(field))
  }
  // zod treats a missing key as invalid even for z.unknown(); an unanswered
  // field must reach its own check, so fill absent keys with null.
  const withAllKeys = (input: unknown) => {
    const answers = { ...((input ?? {}) as Record<string, unknown>) }
    for (const key of Object.keys(shape)) answers[key] ??= null
    return answers
  }
  return z.object({
    values: z.preprocess(withAllKeys, z.object(shape)),
  })
}

/** One message per field key; empty when everything is valid. */
export function validateCaseFile<F extends SchemaField>(
  fields: F[],
  values: CaseFileValues,
  fieldsByKey: Map<string, F>,
  isRequired?: (field: F) => boolean
): Record<string, string> {
  const schema = caseFileSchema(fields, values, fieldsByKey, isRequired)
  const result = schema.safeParse({ values })
  const errors: Record<string, string> = {}
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = issue.path[1]
      if (typeof key === 'string' && !(key in errors)) {
        errors[key] = issue.message
      }
    }
  }
  return errors
}

/**
 * A react-hook-form resolver for forms shaped `{ values: {...} }`. The schema
 * is rebuilt from the answers on every validation, because conditions decide
 * which fields apply.
 */
export function caseFileResolver<F extends SchemaField>(
  fields: F[],
  fieldsByKey: Map<string, F>,
  // Answers that live outside the form, e.g. fields in other groups.
  baseValues: CaseFileValues = {},
  isRequired?: (field: F) => boolean
): Resolver<{ values: CaseFileValues }> {
  return (data, context, options) => {
    const schema = caseFileSchema(
      fields,
      { ...baseValues, ...data.values },
      fieldsByKey,
      isRequired
    )
    return zodResolver(schema as never)(
      data as FieldValues,
      context,
      options as never
    ) as ReturnType<Resolver<{ values: CaseFileValues }>>
  }
}
