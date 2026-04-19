import { z } from 'zod'
import { ChevronDown } from 'lucide-react'
import type { SelectSettings } from '../../api/types'
import type { FieldTypeDefinition } from './types'
import { SelectSettingsSection } from './settings-sections'

const selectOptionSchema = z.object({
  label: z.string().min(1, 'Bezeichnung erforderlich'),
  value: z.string().min(1, 'Wert erforderlich'),
})

const selectSettingsSchema = z.object({
  placeholder: z.string().optional(),
  options: z.array(selectOptionSchema),
})

export const selectFieldType: FieldTypeDefinition = {
  type: 'select',
  label: 'Auswahl',
  description: 'Dropdown-Liste',
  icon: ChevronDown,
  schema: selectSettingsSchema,
  defaultSettings: () => ({ options: [] }) as SelectSettings,
  getFormDefaults: (settings) => {
    const s = settings as SelectSettings
    return { placeholder: s.placeholder ?? '', options: s.options ?? [] }
  },
  buildSettings: (data) => ({
    placeholder: (data.placeholder as string) || undefined,
    options: data.options as SelectSettings['options'],
  }),
  SettingsSection: SelectSettingsSection,
  toSchemaProps: (settings) => {
    const s = settings as SelectSettings
    return {
      type: 'string',
      enum: s.options.map((o) => o.value),
    }
  },
  toUiSchemaProps: (settings) => {
    const s = settings as SelectSettings
    const prop: Record<string, unknown> = {}
    if (s.placeholder) prop['ui:placeholder'] = s.placeholder
    prop['ui:options'] = { labels: s.options }
    return prop
  },
  fromSchemaProp: (schemaProp, uiProp) => {
    const enumValues = (schemaProp.enum ?? []) as string[]
    const opts = (uiProp['ui:options'] ?? {}) as Record<string, unknown>
    const labels = opts.labels as
      | Array<{ value: string; label: string }>
      | undefined
    return {
      placeholder: (uiProp['ui:placeholder'] as string) ?? undefined,
      options: labels ?? enumValues.map((v) => ({ value: v, label: v })),
    }
  },
  settingsChips: (settings) => {
    const s = settings as SelectSettings
    const chips: string[] = []
    if (s.placeholder) chips.push(`Platzhalter: "${s.placeholder}"`)
    if (!s.options || s.options.length === 0) return chips
    if (s.options.length <= 3) {
      chips.push(s.options.map((o) => o.label).join(', '))
    } else {
      chips.push(`${s.options.length} Optionen`)
    }
    return chips
  },
}
