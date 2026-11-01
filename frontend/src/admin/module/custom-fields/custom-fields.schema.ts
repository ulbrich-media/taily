import type {
  CustomFieldDefinitionGroup,
  CustomFieldSection,
} from '@/api/types/custom-fields'
import { z } from 'zod'
import type { JsonSchema } from '@/api/types/form-schemas'
import {
  buildFormDataDefaults,
  buildPropertySchema,
} from '@/components/form/jsonSchemaToZod'

/** The form field namespace all custom fields share (keys are unique per entity). */
export const CUSTOM_FIELDS_KEY = 'custom_fields'

export function groupsForSection(
  groups: CustomFieldDefinitionGroup[] | undefined,
  section: CustomFieldSection
): CustomFieldDefinitionGroup[] {
  return (groups ?? [])
    .filter((group) => group.section === section)
    .sort((a, b) => a.position - b.position)
}

/**
 * The schema a group is edited with: groups that are shown only because the
 * record still holds values (`in_scope: false`) don't enforce `required`.
 */
export function effectiveGroupSchema(
  group: CustomFieldDefinitionGroup
): JsonSchema {
  if (group.in_scope) return group.template.schema
  const { required: _required, ...rest } = group.template.schema
  return rest
}

/**
 * Merges the schemas of a section's groups into one object schema for
 * jsonSchemaToZod. Keys are unique per entity, so properties never collide.
 */
export function mergeCustomFieldSchemas(
  groups: CustomFieldDefinitionGroup[]
): JsonSchema {
  const properties: NonNullable<JsonSchema['properties']> = {}
  const required: string[] = []

  for (const group of groups) {
    const schema = effectiveGroupSchema(group)
    Object.assign(properties, schema.properties ?? {})
    required.push(...(schema.required ?? []))
  }

  return { type: 'object', properties, required }
}

/**
 * "No value", as the backend sees it: empty values are not stored, and a
 * switch that is off is stored as absent.
 */
export function isEmptyCustomFieldValue(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    value === false ||
    (Array.isArray(value) && value.length === 0)
  )
}

export function sameCustomFieldValue(value: unknown, stored: unknown) {
  return (
    value === stored ||
    (isEmptyCustomFieldValue(value) && isEmptyCustomFieldValue(stored))
  )
}

/**
 * The zod schema of `custom_fields` on an edit form, mirroring the backend
 * (see "Writing values" in docs/features/custom-fields.md): filled values
 * that are unchanged are not validated, so a value an older template allowed
 * does not block saving, and `required` only applies to groups with a
 * changed value.
 */
export function buildCustomFieldsEditSchema(
  groups: CustomFieldDefinitionGroup[],
  values: Record<string, unknown>,
  stored: Record<string, unknown>
): z.ZodTypeAny {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const group of groups) {
    const schema = effectiveGroupSchema(group)
    const properties = schema.properties ?? {}
    const keys = Object.keys(properties)
    const changed = keys.some(
      (key) => !sameCustomFieldValue(values[key], stored[key])
    )
    const required = changed ? (schema.required ?? []) : []

    for (const key of keys) {
      const keptAsStored =
        sameCustomFieldValue(values[key], stored[key]) &&
        !isEmptyCustomFieldValue(stored[key])
      shape[key] = keptAsStored
        ? z.unknown()
        : buildPropertySchema(properties[key], required.includes(key))
    }
  }

  return z.object(shape)
}

/** defaultValues for `custom_fields`: every key of the groups, see buildFormDataDefaults. */
export function buildCustomFieldDefaults(
  groups: CustomFieldDefinitionGroup[],
  values: Record<string, unknown> | null | undefined = {}
): Record<string, unknown> {
  return buildFormDataDefaults(mergeCustomFieldSchemas(groups), values ?? {})
}

/**
 * Converts form values to the request payload. An emptied field must reach
 * the backend to clear the stored value, so `undefined` (dropped by
 * JSON.stringify) becomes `null`.
 */
export function toCustomFieldsPayload(
  values: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values ?? {}).map(([key, value]) => [
      key,
      value === undefined ? null : value,
    ])
  )
}
