import { z } from 'zod'
import type { JsonSchema, JsonSchemaProperty } from '@/api/types/form-schemas'

/**
 * Builds the initial form_data defaultValues object so that every key defined
 * in the schema is present from the start. Without this, Controller components
 * add keys to the form state as they mount, making the deep-equality check
 * that drives isDirty see a structural difference vs. the original defaultValues
 * — causing FormBlocker to trigger even when the user changed nothing.
 */
export function buildFormDataDefaults(
  schema: JsonSchema | null | undefined,
  existingData: Record<string, unknown> = {}
): Record<string, unknown> {
  if (!schema?.properties) return existingData
  return Object.fromEntries(
    Object.keys(schema.properties).map((key) => [key, existingData[key]])
  )
}

/**
 * Converts a JSON Schema (subset) into a Zod schema suitable for use as a
 * resolver-side validator for DynamicFormFields. Mirrors the rules built by
 * buildRules() in DynamicFormFields.tsx so both paths stay in sync.
 */
export function jsonSchemaToZod(
  schema: JsonSchema | null | undefined
): z.ZodTypeAny {
  if (!schema?.properties) return z.record(z.string(), z.unknown())

  const required = schema.required ?? []
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const [key, prop] of Object.entries(schema.properties)) {
    shape[key] = buildPropertySchema(prop, required.includes(key))
  }

  return z.object(shape)
}

const REQUIRED_MSG = 'Dieses Feld ist erforderlich'

function buildPropertySchema(
  prop: JsonSchemaProperty,
  isRequired: boolean
): z.ZodTypeAny {
  if (prop.type === 'boolean') {
    // Untouched Switch keeps value as undefined; default to false so it
    // matches what the UI shows (off) and avoids a type-level Zod error.
    const base = z.boolean().default(false)
    if (isRequired) {
      // A required switch must be explicitly enabled — covers consent and
      // confirmation fields. false (or never-touched) fails with a clear message.
      return base.refine((v) => v === true, REQUIRED_MSG)
    }
    return base
  }

  if (prop.type === 'number' || prop.type === 'integer') {
    // Use error on the constructor so undefined triggers the human-readable
    // message instead of Zod's generic "Invalid input" type error.
    let s = z.number({ error: isRequired ? REQUIRED_MSG : undefined })
    if (prop.type === 'integer') s = s.int('Bitte eine ganze Zahl eingeben')
    if (prop.minimum !== undefined)
      s = s.min(prop.minimum, `Mindestwert: ${prop.minimum}`)
    if (prop.maximum !== undefined)
      s = s.max(prop.maximum, `Maximalwert: ${prop.maximum}`)
    if (prop.multipleOf !== undefined)
      s = s.multipleOf(
        prop.multipleOf,
        `Muss ein Vielfaches von ${prop.multipleOf} sein`
      )
    return isRequired ? s : s.optional()
  }

  if (prop.enum) {
    const s = z.enum(prop.enum as [string, ...string[]], {
      error: 'Bitte eine Option auswählen',
    })
    return isRequired ? s : s.optional()
  }

  // string (text, textarea, email, phone, date)
  // Set error on the constructor for the undefined/non-string case, then add
  // .min(1) for the empty-string case — both surface the same message.
  let s = z.string({ error: isRequired ? REQUIRED_MSG : undefined })
  if (prop.format === 'email')
    s = s.check(z.email({ error: 'Bitte eine gültige E-Mail-Adresse eingeben' }))
  if (prop.minLength !== undefined && prop.minLength > 0) {
    s = s.min(prop.minLength, `Mindestens ${prop.minLength} Zeichen`)
  } else if (isRequired) {
    s = s.min(1, REQUIRED_MSG)
  }
  if (prop.maxLength !== undefined)
    s = s.max(prop.maxLength, `Maximal ${prop.maxLength} Zeichen`)
  return isRequired ? s : s.optional()
}
