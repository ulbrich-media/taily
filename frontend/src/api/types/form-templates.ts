// Mirrors: api/app/Http/Resources/FormTemplateResource.php

export interface FormTemplateResource {
  id: string
  type: string
  name: string
  schema: Record<string, unknown>
  ui_schema: Record<string, unknown> | null
  version: number
  created_at: string
  updated_at: string
}
