import { z } from 'zod'
import { Link2 } from 'lucide-react'
import type { LinkedSettings } from '../../api/types'
import type { FieldTypeDefinition } from './types'
import {
  LINK_ENTITY_LABELS,
  linkedSettingsFrom,
  linkedUiSchemaProps,
} from '../linked-field'

/**
 * "Feld übernehmen": a copy of a person or animal field. Edited by
 * LinkedFieldForm instead of the generic form, since key, type and options
 * come from the source field.
 */
export const linkedFieldType: FieldTypeDefinition = {
  type: 'linked',
  label: 'Feld übernehmen',
  description: 'Feld einer Person oder eines Tiers',
  icon: Link2,
  schema: z.object({}),
  defaultSettings: (): LinkedSettings => ({ schema: {}, ui: {} }),
  getFormDefaults: () => ({}),
  buildSettings: () => ({ schema: {}, ui: {} }),
  SettingsSection: null,
  // The copied fragment is emitted unchanged.
  toSchemaProps: (settings) => ({ ...(settings as LinkedSettings).schema }),
  toUiSchemaProps: (settings) =>
    linkedUiSchemaProps(settings as LinkedSettings),
  fromSchemaProp: (schemaProp, uiProp) =>
    linkedSettingsFrom(schemaProp, uiProp),
  settingsChips: (settings) => {
    const s = settings as LinkedSettings
    const chips: string[] = []
    if (s.link)
      chips.push(`${LINK_ENTITY_LABELS[s.link.entity]}: ${s.link.field}`)
    if (s.placeholder) chips.push(`Platzhalter: "${s.placeholder}"`)
    return chips
  },
}
