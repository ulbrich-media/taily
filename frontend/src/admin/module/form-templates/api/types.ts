// ---------------------------------------------------------------------------
// Response types (returned by the API)
// ---------------------------------------------------------------------------

import type { FormTemplateResource } from '@/api/types/form-templates'

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
  type: string
  name: string
  schema: Record<string, unknown>
  ui_schema: Record<string, unknown>
}

export interface UpdateFormTemplateRequest {
  name: string
  schema: Record<string, unknown>
  ui_schema: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Form schema types (used by the form builder — not API resource shapes)
// ---------------------------------------------------------------------------

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'checkbox'
  | 'select'
  | 'date'
  | 'email'
  | 'phone'
  | 'radio'
  | 'heading'

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

export type FieldSettings =
  | TextSettings
  | NumberSettings
  | SelectSettings
  | DateSettings
  | EmailSettings
  | PhoneSettings
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
