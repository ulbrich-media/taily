import type {
  CustomFieldGroupField,
  CustomFieldGroupResource,
} from '@/api/types/custom-fields'
import type { FormTemplateResource } from '@/api/types/form-templates'
import type { UiSchemaFieldOptions } from '@/api/types/form-schemas'
import { detectFieldType } from '@/lib/form-schema/detect-field-type'
import { resolveFieldOrder } from '@/lib/form-schema/resolve-field-order'
import {
  CUSTOM_FIELD_ENTITY_LABELS,
  customFieldPersonRoleLabel,
  customFieldSectionLabel,
} from './custom-field.labels'

/**
 * The fields of a template's latest version as the group dialog lists them:
 * in ui:order, headings excluded. Mirrors `fields` of CustomFieldGroupResource
 * so the settings table also works before the group is saved.
 */
export function templateFields(
  template: Pick<FormTemplateResource, 'schema' | 'ui_schema'> | undefined
): CustomFieldGroupField[] {
  const properties = template?.schema.properties
  if (!properties) return []
  const uiSchema = template.ui_schema ?? {}

  return resolveFieldOrder(properties, uiSchema['ui:order'], uiSchema)
    .filter((key) => key in properties)
    .map((key) => {
      const uiOptions = (uiSchema[key] ?? {}) as UiSchemaFieldOptions
      return {
        key,
        label: uiOptions['ui:title'] ?? properties[key].title ?? key,
        type: detectFieldType(properties[key], uiOptions),
      }
    })
    .filter((field) => field.type !== 'heading')
}

/** "Alle Tierarten" / "Hund, Katze" / "Adoptant" — the group's scope in one line. */
export function describeGroupScope(group: CustomFieldGroupResource): string {
  if (group.entity === 'animal') {
    return group.animal_types.length
      ? group.animal_types.map((type) => type.title).join(', ')
      : 'Alle Tierarten'
  }
  return group.person_roles.length
    ? group.person_roles.map(customFieldPersonRoleLabel).join(', ')
    : 'Alle Personen'
}

/** "Tier › Basis (Größe)" */
export function describeGroupPlacement(group: {
  entity: CustomFieldGroupResource['entity']
  section: CustomFieldGroupResource['section']
  title: string
}): string {
  return `${CUSTOM_FIELD_ENTITY_LABELS[group.entity]} › ${customFieldSectionLabel(group.entity, group.section)} (${group.title})`
}
