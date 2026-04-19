import type { FieldType } from '../api/types'
import type { EditorField } from './shared/EditorField'
import { getFieldTypeDef } from './field-types'

export const DROPPABLE_ID = 'field-list'

type JsonSchemaProp = Record<string, unknown>

/** Detect the editor FieldType from a JSON Schema property and its uiSchema entry. */
function detectFieldType(
  schemaProp: JsonSchemaProp,
  uiProp: JsonSchemaProp
): FieldType {
  const widget = uiProp['ui:widget'] as string | undefined
  const jsonType = schemaProp.type as string

  // Explicit widget markers take priority
  if (widget === 'heading') return 'heading'
  if (widget === 'date') return 'date'
  if (widget === 'email') return 'email'
  if (widget === 'phone') return 'phone'
  if (widget === 'radio') return 'radio'
  if (widget === 'textarea') return 'textarea'

  // Fall back to JSON Schema type
  if (jsonType === 'null') return 'heading'
  if (jsonType === 'boolean') return 'checkbox'
  if (jsonType === 'number' || jsonType === 'integer') return 'number'
  if (Array.isArray(schemaProp.enum)) return 'select'

  // Format-based detection
  if (schemaProp.format === 'date') return 'date'
  if (schemaProp.format === 'email') return 'email'
  if (schemaProp.format === 'phone') return 'phone'

  return 'text'
}

/**
 * Converts a JSON Schema (Draft-07) + RJSF-style uiSchema into the editor's field list.
 */
export function parseJsonSchema(
  schema: Record<string, unknown>,
  uiSchema: Record<string, unknown> | null
): EditorField[] {
  const properties = (schema.properties ?? {}) as Record<string, JsonSchemaProp>
  const required = (schema.required ?? []) as string[]
  const ui = uiSchema ?? {}
  const fieldOrder = (ui['ui:order'] ?? []) as string[]

  // Use explicit order if available, fall back to Object.keys order
  const keys =
    fieldOrder.length > 0
      ? [
          ...fieldOrder.filter((k) => k in properties),
          ...Object.keys(properties).filter((k) => !fieldOrder.includes(k)),
        ]
      : Object.keys(properties)

  return keys.map((key) => {
    const schemaProp = properties[key]
    const uiProp = (ui[key] ?? {}) as JsonSchemaProp
    const fieldType = detectFieldType(schemaProp, uiProp)
    const def = getFieldTypeDef(fieldType)

    return {
      id: key,
      type: fieldType,
      label:
        (uiProp['ui:title'] as string) || (schemaProp.title as string) || key,
      description: (schemaProp.description as string) ?? undefined,
      required: required.includes(key),
      settings: def.fromSchemaProp(schemaProp, uiProp),
    }
  })
}

export interface BuildResult {
  schema: Record<string, unknown>
  uiSchema: Record<string, unknown>
}

/**
 * Converts the editor's field list into a JSON Schema (Draft-07) + RJSF-style uiSchema.
 */
export function buildJsonSchema(
  fields: EditorField[],
  title: string
): BuildResult {
  const schemaProperties: Record<string, JsonSchemaProp> = {}
  const uiSchemaEntries: Record<string, JsonSchemaProp> = {}
  const required: string[] = []

  for (const field of fields) {
    if (field._deleted) continue

    const def = getFieldTypeDef(field.type)

    // Schema property (validation only)
    const schemaProp: JsonSchemaProp = {
      ...def.toSchemaProps(field.settings),
    }
    if (field.description) schemaProp.description = field.description

    schemaProperties[field.id] = schemaProp

    // UiSchema entry (presentation)
    const uiProp: JsonSchemaProp = {
      'ui:title': field.label,
      ...def.toUiSchemaProps(field.settings),
    }
    uiSchemaEntries[field.id] = uiProp

    if (field.required) required.push(field.id)
  }

  const fieldOrder = fields.filter((f) => !f._deleted).map((f) => f.id)

  return {
    schema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      title,
      properties: schemaProperties,
      required,
      additionalProperties: false,
    },
    uiSchema: {
      'ui:order': fieldOrder,
      ...uiSchemaEntries,
    },
  }
}
