import { z } from 'zod'
import { Phone } from 'lucide-react'
import type { PhoneSettings } from '../../api/types'
import type { FieldTypeDefinition } from './types'
import { PhoneSettingsSection } from './settings-sections'

const phoneSettingsSchema = z.object({
  placeholder: z.string().optional(),
})

export const phoneFieldType: FieldTypeDefinition = {
  type: 'phone',
  label: 'Telefon',
  description: 'Telefonnummer',
  icon: Phone,
  schema: phoneSettingsSchema,
  defaultSettings: () => ({}) as PhoneSettings,
  getFormDefaults: (settings) => {
    const s = settings as PhoneSettings
    return { placeholder: s.placeholder ?? '' }
  },
  buildSettings: (data) => ({
    placeholder: (data.placeholder as string) || undefined,
  }),
  SettingsSection: PhoneSettingsSection,
  toSchemaProps: () => ({
    type: 'string',
    format: 'phone',
  }),
  toUiSchemaProps: (settings) => {
    const s = settings as PhoneSettings
    const prop: Record<string, unknown> = { 'ui:widget': 'phone' }
    if (s.placeholder) prop['ui:placeholder'] = s.placeholder
    return prop
  },
  fromSchemaProp: (_schemaProp, uiProp) => ({
    placeholder: (uiProp['ui:placeholder'] as string) ?? undefined,
  }),
  settingsChips: (settings) => {
    const s = settings as PhoneSettings
    const chips: string[] = []
    if (s.placeholder) chips.push(`Platzhalter: "${s.placeholder}"`)
    return chips
  },
}
