import { z } from 'zod'
import { CircleDot } from 'lucide-react'
import type { SelectSettings } from '../../api/types'
import type { FieldTypeDefinition } from './types'
import { RadioSettingsSection } from './settings-sections'

const radioOptionSchema = z.object({
  label: z.string().min(1, 'Bezeichnung erforderlich'),
  value: z.string().min(1, 'Wert erforderlich'),
})

const radioSettingsSchema = z.object({
  options: z.array(radioOptionSchema),
})

export const radioFieldType: FieldTypeDefinition = {
  type: 'radio',
  label: 'Radio-Auswahl',
  description: 'Einzelauswahl (Radiobuttons)',
  icon: CircleDot,
  schema: radioSettingsSchema,
  defaultSettings: () => ({ options: [] }) as SelectSettings,
  getFormDefaults: (settings) => {
    const s = settings as SelectSettings
    return { options: s.options ?? [] }
  },
  buildSettings: (data) => ({
    options: data.options as SelectSettings['options'],
  }),
  SettingsSection: RadioSettingsSection,
  toSchemaProps: (settings) => {
    const s = settings as SelectSettings
    return {
      type: 'string',
      enum: s.options.map((o) => o.value),
    }
  },
  toUiSchemaProps: (settings) => {
    const s = settings as SelectSettings
    return {
      'ui:widget': 'radio',
      'ui:options': { labels: s.options },
    }
  },
  fromSchemaProp: (schemaProp, uiProp) => {
    const enumValues = (schemaProp.enum ?? []) as string[]
    const opts = (uiProp['ui:options'] ?? {}) as Record<string, unknown>
    const labels = opts.labels as
      | Array<{ value: string; label: string }>
      | undefined
    return {
      options: labels ?? enumValues.map((v) => ({ value: v, label: v })),
    }
  },
  settingsChips: (settings) => {
    const s = settings as SelectSettings
    if (!s.options || s.options.length === 0) return []
    if (s.options.length <= 3) {
      return [s.options.map((o) => o.label).join(', ')]
    }
    return [`${s.options.length} Optionen`]
  },
}
