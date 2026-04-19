import { z } from 'zod'
import { CheckSquare } from 'lucide-react'
import type { FieldTypeDefinition } from './types'

export const checkboxFieldType: FieldTypeDefinition = {
  type: 'checkbox',
  label: 'Checkbox',
  description: 'Ja / Nein-Option',
  icon: CheckSquare,
  schema: z.object({}),
  defaultSettings: () => ({}),
  getFormDefaults: () => ({}),
  buildSettings: () => ({}),
  SettingsSection: null,
  toSchemaProps: () => ({ type: 'boolean' }),
  toUiSchemaProps: () => ({}),
  fromSchemaProp: () => ({}),
  settingsChips: () => [],
}
