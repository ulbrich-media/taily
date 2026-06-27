import type { JsonSchemaProperty, UiSchemaFieldOptions } from '@/api/types/form-schemas'
import type { FieldType } from './field-type'

export function detectFieldType(
  prop: JsonSchemaProperty,
  uiOptions: UiSchemaFieldOptions
): FieldType {
  const widget = uiOptions['ui:widget']
  const jsonType = prop.type

  // Explicit widget markers take priority
  if (widget === 'heading') return 'heading'
  if (widget === 'date') return 'date'
  if (widget === 'email') return 'email'
  if (widget === 'phone') return 'phone'
  if (widget === 'radio') return 'radio'
  if (widget === 'textarea') return 'textarea'

  // Fall back to JSON Schema type
  if (jsonType === 'null') return 'heading'
  if (jsonType === 'boolean') return 'checkbox'
  if (jsonType === 'number' || jsonType === 'integer') return 'number'
  if (Array.isArray(prop.enum)) return 'select'

  // Format-based detection
  if (prop.format === 'date') return 'date'
  if (prop.format === 'email') return 'email'
  if (prop.format === 'phone') return 'phone'

  return 'text'
}
