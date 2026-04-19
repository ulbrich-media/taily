import type { FieldType } from '../../api/types'
import type { FieldTypeDefinition } from './types'
import { textFieldType, textareaFieldType } from './text'
import { numberFieldType } from './number'
import { checkboxFieldType } from './checkbox'
import { selectFieldType } from './select'
import { dateFieldType } from './date'
import { emailFieldType } from './email'
import { phoneFieldType } from './phone'
import { radioFieldType } from './radio'
import { headingFieldType } from './heading'

export type { FieldTypeDefinition }

const fieldTypeRegistry = new Map<FieldType, FieldTypeDefinition>([
  ['text', textFieldType],
  ['textarea', textareaFieldType],
  ['number', numberFieldType],
  ['checkbox', checkboxFieldType],
  ['select', selectFieldType],
  ['date', dateFieldType],
  ['email', emailFieldType],
  ['phone', phoneFieldType],
  ['radio', radioFieldType],
  ['heading', headingFieldType],
])

export function getFieldTypeDef(type: FieldType): FieldTypeDefinition {
  const def = fieldTypeRegistry.get(type)
  if (!def) throw new Error(`Unknown field type: ${type}`)
  return def
}

export const allFieldTypes = Array.from(fieldTypeRegistry.values())
