/**
 * Shared types for the JSON Schema (Draft-07 subset) and RJSF-style uiSchema
 * that the backend stores and returns for dynamic form templates.
 *
 * Both types carry an index signature so they remain assignable to
 * Record<string, unknown> — existing code that accepts the looser type keeps
 * compiling without casts.
 */

export interface JsonSchemaProperty {
  type?: string
  title?: string
  description?: string
  enum?: string[]
  format?: string
  minimum?: number
  maximum?: number
  multipleOf?: number
  minLength?: number
  maxLength?: number
  [key: string]: unknown
}

export interface JsonSchema {
  $schema?: string
  type?: string
  title?: string
  properties?: Record<string, JsonSchemaProperty>
  required?: string[]
  additionalProperties?: boolean
  [key: string]: unknown
}

export interface UiSchemaFieldOptions {
  'ui:title'?: string
  'ui:widget'?: string
  'ui:placeholder'?: string
  'ui:options'?: {
    labels?: Array<{ value: string; label: string }>
    rows?: number
  }
}

export interface UiSchema {
  'ui:order'?: string[]
  [key: string]: UiSchemaFieldOptions | string[] | undefined
}
