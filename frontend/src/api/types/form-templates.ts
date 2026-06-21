import type { JsonSchema, UiSchema } from './form-schemas'

export type { JsonSchema, UiSchema } from './form-schemas'

// Mirrors: FormTemplateVersionResource (embedded in the detail response)
export interface FormTemplateVersionResource {
  id: string // version UUID
  form_template_id: string
  version: number
  submissions_count: number
  schema: JsonSchema
  ui_schema: UiSchema | null
  created_at: string
  updated_at: string
}

// Mirrors: FormTemplateResource (stable form entity with latest version flattened in)
// The `versions` array is only present on the detail (show) response, not the list.
export interface FormTemplateResource {
  id: string // stable form UUID — never changes across version bumps
  name: string
  version: number // latest version number
  version_id: string // latest version UUID — used for submission pinning
  schema: JsonSchema
  ui_schema: UiSchema | null
  submissions_count: number
  created_at: string
  updated_at: string
  versions?: FormTemplateVersionResource[]
}
