import { z } from 'zod'

interface JsonSchemaProperty {
  type?: string
  enum?: string[]
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
}

export interface JsonSchemaShape {
  properties?: Record<string, JsonSchemaProperty>
  required?: string[]
}

/**
 * Converts a JSON Schema (subset) into a Zod schema suitable for use as a
 * resolver-side validator for DynamicFormFields. Mirrors the rules built by
 * buildRules() in DynamicFormFields.tsx so both paths stay in sync.
 */
export function jsonSchemaToZod(
  schema: JsonSchemaShape | null | undefined
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
    const s = z.boolean()
    return isRequired ? s : s.optional()
  }

  if (prop.type === 'number' || prop.type === 'integer') {
    // Use error on the constructor so undefined triggers the human-readable
    // message instead of Zod's generic "Invalid input" type error.
    let s = z.number({ error: isRequired ? REQUIRED_MSG : undefined })
    if (prop.minimum !== undefined)
      s = s.min(prop.minimum, `Mindestwert: ${prop.minimum}`)
    if (prop.maximum !== undefined)
      s = s.max(prop.maximum, `Maximalwert: ${prop.maximum}`)
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
  if (prop.minLength !== undefined && prop.minLength > 0) {
    s = s.min(prop.minLength, `Mindestens ${prop.minLength} Zeichen`)
  } else if (isRequired) {
    s = s.min(1, REQUIRED_MSG)
  }
  if (prop.maxLength !== undefined)
    s = s.max(prop.maxLength, `Maximal ${prop.maxLength} Zeichen`)
  return isRequired ? s : s.optional()
}
