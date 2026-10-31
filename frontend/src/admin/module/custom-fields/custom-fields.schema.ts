import type {
  CustomFieldDefinitionGroup,
  CustomFieldSection,
} from '@/api/types/custom-fields'
import type { JsonSchema } from '@/api/types/form-schemas'
import { buildFormDataDefaults } from '@/components/form/jsonSchemaToZod'

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
