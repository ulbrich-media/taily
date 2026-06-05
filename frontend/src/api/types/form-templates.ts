// Mirrors: FormTemplateResource (stable form entity with latest version flattened in)
export interface FormTemplateResource {
  id: string         // stable form UUID — never changes across version bumps
  name: string
  version: number    // latest version number
  version_id: string // latest version UUID — used for submission pinning
  schema: Record<string, unknown>
  ui_schema: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

// Mirrors: FormTemplateVersionResource (a specific version, returned by the versions list)
export interface FormTemplateVersionResource {
  id: string              // version UUID
  form_template_id: string
  name: string
  version: number
  schema: Record<string, unknown>
  ui_schema: Record<string, unknown> | null
  created_at: string
  updated_at: string
}
