// Mirrors: CustomFieldGroupResource, CustomFieldDefinitionResource and the
//          409 removal impact payload (see docs/features/custom-fields.md).

import type { JsonSchema, JsonSchemaProperty, UiSchema } from './form-schemas'
import type { FieldType } from '@/lib/form-schema/field-type'

export type CustomFieldEntity = 'animal' | 'person'

export type AnimalCustomFieldSection = 'basic' | 'extra'
export type PersonCustomFieldSection = 'basic'
export type CustomFieldSection =
  AnimalCustomFieldSection | PersonCustomFieldSection

export type CustomFieldPersonRole =
  'adopter' | 'mediator' | 'inspector' | 'foster'

export interface CustomFieldSetting {
  public?: boolean
}

export type CustomFieldSettings = Record<string, CustomFieldSetting>

/** A field of the bound template, as listed on a Field Group (headings excluded). */
export interface CustomFieldGroupField {
  key: string
  label: string
  type: FieldType
}

// Returned by the admin CRUD /custom-field-groups.
export interface CustomFieldGroupResource {
  id: string
  entity: CustomFieldEntity
  section: CustomFieldSection
  title: string
  position: number
  animal_type_ids: string[]
  animal_types: { id: string; title: string }[]
  person_roles: CustomFieldPersonRole[]
  form_template_id: string
  form_template: { id: string; name: string }
  field_settings: CustomFieldSettings
  fields: CustomFieldGroupField[]
  created_at: string
  updated_at: string
}

// Returned by GET /custom-fields/definitions.
export interface CustomFieldDefinitionGroup {
  id: string
  title: string
  section: CustomFieldSection
  position: number
  /** False: shown only because the record holds values; required is not enforced. */
  in_scope: boolean
  field_settings: CustomFieldSettings
  template: {
    id: string
    version_id: string
    schema: JsonSchema
    ui_schema: UiSchema | null
  }
}

/** A required field of an in-scope group without a value. */
export interface CustomFieldMissing {
  key: string
  label: string
  section: CustomFieldSection
}

/** Part of a 409 answer: the values a save or delete would remove. */
export interface CustomFieldRemovalImpact {
  key: string
  label: string
  /** Set when a select/radio option is removed. */
  option: string | null
  /** Number of records losing the value. */
  count: number
}

/** A field whose kept values the new template rules reject. */
export interface CustomFieldInvalidValues {
  key: string
  label: string
  /** Number of records holding such a value. */
  count: number
}

/** Where a form template is bound as custom fields (on FormTemplateResource). */
export interface FormTemplateCustomFieldGroupRef {
  id: string
  entity: CustomFieldEntity
  section: CustomFieldSection
  title: string
}

// Returned by GET /custom-fields/linkable: a field a "Feld übernehmen" field
// of a form template can link to. See "Linked fields" in custom-fields.md.
export interface LinkableField {
  /** `core.<column>` or `custom.<key>` */
  field: string
  label: string
  kind: 'core' | 'custom'
  /** Title of the custom field's group; null for core fields. */
  group: string | null
  /** Suggested (and locked) key in the template: `<entity>_<field>`. */
  key: string
  /** JSON Schema fragment copied into the template's property. */
  schema: JsonSchemaProperty
  /** ui_schema entry incl. `ui:title` and `ui:options.link`. */
  ui_schema: Record<string, unknown>
}
