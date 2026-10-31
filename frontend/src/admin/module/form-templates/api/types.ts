// ---------------------------------------------------------------------------
// Response types (returned by the API)
// ---------------------------------------------------------------------------

import type { FormTemplateResource } from '@/api/types/form-templates'
import type { FieldType } from '@/lib/form-schema/field-type.ts'
import type { CustomFieldEntity } from '@/api/types/custom-fields'

export interface FormTemplatesResponse {
  data: FormTemplateResource[]
}
export interface FormTemplateResponse {
  data: FormTemplateResource
}
export interface UpdateFormTemplateResponse {
  message: string
  new_version_created: boolean
  data: FormTemplateResource
}
export interface CreateFormTemplateResponse {
  message: string
  data: FormTemplateResource
}

// ---------------------------------------------------------------------------
// Request / input types (sent to the API — not resource shapes)
// ---------------------------------------------------------------------------

export interface CreateFormTemplateRequest {
  name: string
  schema: Record<string, unknown>
  ui_schema: Record<string, unknown>
}

export interface UpdateFormTemplateRequest {
  name: string
  schema: Record<string, unknown>
  ui_schema: Record<string, unknown>
  /** Required to save a bound template when the save deletes custom field values (409 otherwise). */
  confirm_custom_field_removal?: boolean
}

// ---------------------------------------------------------------------------
// Form schema types (used by the form builder — not API resource shapes)
// ---------------------------------------------------------------------------

export interface TextSettings {
  placeholder?: string
  minLength?: number
  maxLength?: number
  rows?: number
}

export interface NumberSettings {
  placeholder?: string
  min?: number
  max?: number
  step?: number
  isInteger?: boolean
}

export interface SelectOption {
  value: string
  label: string
}

export interface SelectSettings {
  placeholder?: string
  options: SelectOption[]
}

export interface DateSettings {
  placeholder?: string
  minDate?: string
  maxDate?: string
}

export interface EmailSettings {
  placeholder?: string
}

export interface PhoneSettings {
  placeholder?: string
}

export interface FieldLink {
  entity: CustomFieldEntity
  /** `core.<column>` or `custom.<key>` */
  field: string
}

/**
 * A "Feld übernehmen" field: a copy of a person or animal field. `schema` and
 * `ui` are the copied fragments and are emitted unchanged; only the
 * placeholder (plus label, description, required) is editable.
 */
export interface LinkedSettings {
  /** Unset only while a newly inserted field has not been picked yet. */
  link?: FieldLink
  /** Copied JSON Schema property, without `description`. */
  schema: Record<string, unknown>
  /** Copied ui_schema entry, without `ui:title`, `ui:placeholder` and the link. */
  ui: Record<string, unknown>
  placeholder?: string
}

export type FieldSettings =
  | TextSettings
  | NumberSettings
  | SelectSettings
  | DateSettings
  | EmailSettings
  | PhoneSettings
  | LinkedSettings
  | Record<string, never>

export interface FormField {
  id: string
  type: FieldType
  label: string
  description?: string
  required: boolean
  settings: FieldSettings
}

export interface FormSchema {
  fields: FormField[]
}
