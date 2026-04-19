import { z } from 'zod'
import { Hash } from 'lucide-react'
import type { NumberSettings } from '../../api/types'
import type { FieldTypeDefinition } from './types'
import { NumberSettingsSection } from './settings-sections'

const numberSettingsSchema = z.object({
  placeholder: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().positive().optional(),
})

export const numberFieldType: FieldTypeDefinition = {
  type: 'number',
  label: 'Zahl',
  description: 'Numerische Eingabe',
  icon: Hash,
  schema: numberSettingsSchema,
  defaultSettings: () => ({}) as NumberSettings,
  getFormDefaults: (settings) => {
    const s = settings as NumberSettings
    return {
      placeholder: s.placeholder ?? '',
      min: s.min,
      max: s.max,
      step: s.step,
    }
  },
  buildSettings: (data) => ({
    placeholder: (data.placeholder as string) || undefined,
    min: data.min as number | undefined,
    max: data.max as number | undefined,
    step: data.step as number | undefined,
  }),
  SettingsSection: NumberSettingsSection,
  toSchemaProps: (settings) => {
    const s = settings as NumberSettings
    const prop: Record<string, unknown> = { type: 'number' }
    if (s.min != null) prop.minimum = s.min
    if (s.max != null) prop.maximum = s.max
    if (s.step != null) prop.multipleOf = s.step
    return prop
  },
  toUiSchemaProps: (settings) => {
    const s = settings as NumberSettings
    const prop: Record<string, unknown> = {}
    if (s.placeholder) prop['ui:placeholder'] = s.placeholder
    return prop
  },
  fromSchemaProp: (schemaProp, uiProp) => ({
    placeholder: (uiProp['ui:placeholder'] as string) ?? undefined,
    min: schemaProp.minimum as number | undefined,
    max: schemaProp.maximum as number | undefined,
    step: schemaProp.multipleOf as number | undefined,
  }),
  settingsChips: (settings) => {
    const s = settings as NumberSettings
    const chips: string[] = []
    if (s.placeholder) chips.push(`Platzhalter: "${s.placeholder}"`)
    if (s.min != null && s.max != null) {
      chips.push(`${s.min}–${s.max}`)
    } else if (s.min != null) {
      chips.push(`Min. ${s.min}`)
    } else if (s.max != null) {
      chips.push(`Max. ${s.max}`)
    }
    if (s.step != null) chips.push(`Schritt: ${s.step}`)
    return chips
  },
}
