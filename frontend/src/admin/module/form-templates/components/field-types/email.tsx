import { z } from 'zod'
import { Mail } from 'lucide-react'
import type { EmailSettings } from '../../api/types'
import type { FieldTypeDefinition } from './types'
import { EmailSettingsSection } from './settings-sections'

const emailSettingsSchema = z.object({
  placeholder: z.string().optional(),
})

export const emailFieldType: FieldTypeDefinition = {
  type: 'email',
  label: 'E-Mail',
  description: 'E-Mail-Adresse',
  icon: Mail,
  schema: emailSettingsSchema,
  defaultSettings: () => ({}) as EmailSettings,
  getFormDefaults: (settings) => {
    const s = settings as EmailSettings
    return { placeholder: s.placeholder ?? '' }
  },
  buildSettings: (data) => ({
    placeholder: (data.placeholder as string) || undefined,
  }),
  SettingsSection: EmailSettingsSection,
  toSchemaProps: () => ({
    type: 'string',
    format: 'email',
  }),
  toUiSchemaProps: (settings) => {
    const s = settings as EmailSettings
    const prop: Record<string, unknown> = { 'ui:widget': 'email' }
    if (s.placeholder) prop['ui:placeholder'] = s.placeholder
    return prop
  },
  fromSchemaProp: (_schemaProp, uiProp) => ({
    placeholder: (uiProp['ui:placeholder'] as string) ?? undefined,
  }),
  settingsChips: (settings) => {
    const s = settings as EmailSettings
    const chips: string[] = []
    if (s.placeholder) chips.push(`Platzhalter: "${s.placeholder}"`)
    return chips
  },
}
