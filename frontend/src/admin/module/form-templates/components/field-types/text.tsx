import { z } from 'zod'
import { Type, AlignLeft } from 'lucide-react'
import type { TextSettings } from '../../api/types'
import type { FieldTypeDefinition } from './types'
import {
  TextSettingsSection,
  TextareaSettingsSection,
} from './settings-sections'

const textSettingsSchema = z.object({
  placeholder: z.string().optional(),
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().nonnegative().optional(),
})

const textareaSettingsSchema = textSettingsSchema.extend({
  rows: z.number().int().positive().optional(),
})

function textSettingsChips(settings: TextSettings): string[] {
  const chips: string[] = []
  if (settings.placeholder) chips.push(`Platzhalter: "${settings.placeholder}"`)
  if (settings.minLength != null && settings.maxLength != null) {
    chips.push(`${settings.minLength}–${settings.maxLength} Zeichen`)
  } else if (settings.minLength != null) {
    chips.push(`Min. ${settings.minLength} Zeichen`)
  } else if (settings.maxLength != null) {
    chips.push(`Max. ${settings.maxLength} Zeichen`)
  }
  return chips
}

function textareaSettingsChips(settings: TextSettings): string[] {
  const chips = textSettingsChips(settings)
  if (settings.rows != null) chips.push(`${settings.rows} Zeilen`)
  return chips
}

export const textFieldType: FieldTypeDefinition = {
  type: 'text',
  label: 'Textfeld',
  description: 'Einzeiliger Text',
  icon: Type,
  schema: textSettingsSchema,
  defaultSettings: () => ({}) as TextSettings,
  getFormDefaults: (settings) => {
    const s = settings as TextSettings
    return {
      placeholder: s.placeholder ?? '',
      minLength: s.minLength,
      maxLength: s.maxLength,
    }
  },
  buildSettings: (data) => ({
    placeholder: (data.placeholder as string) || undefined,
    minLength: data.minLength as number | undefined,
    maxLength: data.maxLength as number | undefined,
  }),
  SettingsSection: TextSettingsSection,
  toSchemaProps: (settings) => {
    const s = settings as TextSettings
    const prop: Record<string, unknown> = { type: 'string' }
    if (s.minLength != null) prop.minLength = s.minLength
    if (s.maxLength != null) prop.maxLength = s.maxLength
    return prop
  },
  toUiSchemaProps: (settings) => {
    const s = settings as TextSettings
    const prop: Record<string, unknown> = {}
    if (s.placeholder) prop['ui:placeholder'] = s.placeholder
    return prop
  },
  fromSchemaProp: (schemaProp, uiProp) => ({
    placeholder: (uiProp['ui:placeholder'] as string) ?? undefined,
    minLength: schemaProp.minLength as number | undefined,
    maxLength: schemaProp.maxLength as number | undefined,
  }),
  settingsChips: (s) => textSettingsChips(s as TextSettings),
}

export const textareaFieldType: FieldTypeDefinition = {
  type: 'textarea',
  label: 'Textbereich',
  description: 'Mehrzeiliger Text',
  icon: AlignLeft,
  schema: textareaSettingsSchema,
  defaultSettings: () => ({}) as TextSettings,
  getFormDefaults: (settings) => {
    const s = settings as TextSettings
    return {
      placeholder: s.placeholder ?? '',
      minLength: s.minLength,
      maxLength: s.maxLength,
      rows: s.rows,
    }
  },
  buildSettings: (data) => ({
    placeholder: (data.placeholder as string) || undefined,
    minLength: data.minLength as number | undefined,
    maxLength: data.maxLength as number | undefined,
    rows: data.rows as number | undefined,
  }),
  SettingsSection: TextareaSettingsSection,
  toSchemaProps: (settings) => {
    const s = settings as TextSettings
    const prop: Record<string, unknown> = { type: 'string' }
    if (s.minLength != null) prop.minLength = s.minLength
    if (s.maxLength != null) prop.maxLength = s.maxLength
    return prop
  },
  toUiSchemaProps: (settings) => {
    const s = settings as TextSettings
    const prop: Record<string, unknown> = { 'ui:widget': 'textarea' }
    if (s.placeholder) prop['ui:placeholder'] = s.placeholder
    if (s.rows != null) prop['ui:options'] = { rows: s.rows }
    return prop
  },
  fromSchemaProp: (schemaProp, uiProp) => {
    const opts = (uiProp['ui:options'] ?? {}) as Record<string, unknown>
    return {
      placeholder: (uiProp['ui:placeholder'] as string) ?? undefined,
      minLength: schemaProp.minLength as number | undefined,
      maxLength: schemaProp.maxLength as number | undefined,
      rows: opts.rows as number | undefined,
    }
  },
  settingsChips: (s) => textareaSettingsChips(s as TextSettings),
}
