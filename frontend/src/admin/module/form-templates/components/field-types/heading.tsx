import { z } from 'zod'
import { Heading2 } from 'lucide-react'
import type { FieldTypeDefinition } from './types'

export const headingFieldType: FieldTypeDefinition = {
  type: 'heading',
  label: 'Überschrift',
  description: 'Abschnittsüberschrift',
  icon: Heading2,
  showRequired: false,
  schema: z.object({}),
  defaultSettings: () => ({}),
  getFormDefaults: () => ({}),
  buildSettings: () => ({}),
  SettingsSection: null,
  toSchemaProps: () => ({ type: 'null' }),
  toUiSchemaProps: () => ({ 'ui:widget': 'heading' }),
  fromSchemaProp: () => ({}),
  settingsChips: () => [],
}
