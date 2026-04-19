import { z } from 'zod'
import { Calendar } from 'lucide-react'
import type { DateSettings } from '../../api/types'
import type { FieldTypeDefinition } from './types'
import { DateSettingsSection } from './settings-sections'

const dateSettingsSchema = z.object({
  placeholder: z.string().optional(),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
})

export const dateFieldType: FieldTypeDefinition = {
  type: 'date',
  label: 'Datum',
  description: 'Datumsauswahl',
  icon: Calendar,
  schema: dateSettingsSchema,
  defaultSettings: () => ({}) as DateSettings,
  getFormDefaults: (settings) => {
    const s = settings as DateSettings
    return {
      placeholder: s.placeholder ?? '',
      minDate: s.minDate ?? '',
      maxDate: s.maxDate ?? '',
    }
  },
  buildSettings: (data) => ({
    placeholder: (data.placeholder as string) || undefined,
    minDate: (data.minDate as string) || undefined,
    maxDate: (data.maxDate as string) || undefined,
  }),
  SettingsSection: DateSettingsSection,
  toSchemaProps: () => ({
    type: 'string',
    format: 'date',
  }),
  toUiSchemaProps: (settings) => {
    const s = settings as DateSettings
    const prop: Record<string, unknown> = { 'ui:widget': 'date' }
    if (s.placeholder) prop['ui:placeholder'] = s.placeholder
    const opts: Record<string, unknown> = {}
    if (s.minDate) opts.minDate = s.minDate
    if (s.maxDate) opts.maxDate = s.maxDate
    if (Object.keys(opts).length > 0) prop['ui:options'] = opts
    return prop
  },
  fromSchemaProp: (_schemaProp, uiProp) => {
    const opts = (uiProp['ui:options'] ?? {}) as Record<string, unknown>
    return {
      placeholder: (uiProp['ui:placeholder'] as string) ?? undefined,
      minDate: (opts.minDate as string) ?? undefined,
      maxDate: (opts.maxDate as string) ?? undefined,
    }
  },
  settingsChips: (settings) => {
    const s = settings as DateSettings
    const chips: string[] = []
    if (s.placeholder) chips.push(`Platzhalter: "${s.placeholder}"`)
    if (s.minDate && s.maxDate) {
      chips.push(`${s.minDate} – ${s.maxDate}`)
    } else if (s.minDate) {
      chips.push(`Ab ${s.minDate}`)
    } else if (s.maxDate) {
      chips.push(`Bis ${s.maxDate}`)
    }
    return chips
  },
}
