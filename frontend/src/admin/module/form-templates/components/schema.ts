import type { EditorField } from './shared/EditorField'
import { getFieldTypeDef } from './field-types'
import { detectFieldType } from '@/lib/form-schema/detect-field-type'
import type { JsonSchemaProperty, UiSchemaFieldOptions } from '@/api/types/form-schemas'

export const DROPPABLE_ID = 'field-list'

/**
 * Converts a JSON Schema (Draft-07) + RJSF-style uiSchema into the editor's field list.
 */
export function parseJsonSchema(
  schema: Record<string, unknown>,
  uiSchema: Record<string, unknown> | null
): EditorField[] {
  const properties = (schema.properties ?? {}) as Record<string, JsonSchemaProperty>
  const required = (schema.required ?? []) as string[]
  const ui = uiSchema ?? {}
  const fieldOrder = (ui['ui:order'] ?? []) as string[]

  // Use explicit order if available, fall back to Object.keys order.
  // Heading fields only exist in uiSchema (no schema property), so include
  // keys from ui:order that have ui:widget=heading even if absent from properties.
  const keys =
    fieldOrder.length > 0
      ? [
          ...fieldOrder.filter(
            (k) =>
              k in properties ||
              (ui[k] as UiSchemaFieldOptions)?.['ui:widget'] === 'heading'
          ),
          ...Object.keys(properties).filter((k) => !fieldOrder.includes(k)),
        ]
      : Object.keys(properties)

  return keys.map((key) => {
    const schemaProp = (properties[key] ?? {}) as JsonSchemaProperty
    const uiProp = (ui[key] ?? {}) as UiSchemaFieldOptions
    const fieldType = detectFieldType(schemaProp, uiProp)
    const def = getFieldTypeDef(fieldType)

    return {
      id: key,
      type: fieldType,
      label: uiProp['ui:title'] || (schemaProp.title as string) || key,
      description: (schemaProp.description as string) ?? undefined,
      required: required.includes(key),
      settings: def.fromSchemaProp(
        schemaProp as Record<string, unknown>,
        uiProp as Record<string, unknown>
      ),
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
  const schemaProperties: Record<string, Record<string, unknown>> = {}
  const uiSchemaEntries: Record<string, Record<string, unknown>> = {}
  const required: string[] = []

  for (const field of fields) {
    if (field._deleted) continue

    const def = getFieldTypeDef(field.type)

    // Headings are layout-only — they carry no submitted value and belong
    // only in uiSchema, not in schema.properties.
    if (field.type !== 'heading') {
      const schemaProp: Record<string, unknown> = {
        ...def.toSchemaProps(field.settings),
      }
      if (field.description) schemaProp.description = field.description
      schemaProperties[field.id] = schemaProp
      if (field.required) required.push(field.id)
    }

    // UiSchema entry (presentation)
    uiSchemaEntries[field.id] = {
      'ui:title': field.label,
      ...def.toUiSchemaProps(field.settings),
    }
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
