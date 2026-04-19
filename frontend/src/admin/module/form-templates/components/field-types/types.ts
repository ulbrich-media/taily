import type { Control, FieldValues } from 'react-hook-form'
import type { z } from 'zod'
import type { FieldType, FieldSettings } from '../../api/types'

export interface FieldTypeDefinition {
  type: FieldType
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  /** Type-specific Zod schema (merged with baseSchema at runtime). */
  schema: z.ZodObject<z.ZodRawShape>
  defaultSettings: () => FieldSettings
  getFormDefaults: (settings: FieldSettings) => Record<string, unknown>
  buildSettings: (formData: Record<string, unknown>) => FieldSettings
  /** Settings UI rendered inside the edit dialog. null = no extra settings. */
  SettingsSection: React.ComponentType<{ control: Control<FieldValues> }> | null
  /** Build the JSON Schema property (validation only: type, format, constraints). */
  toSchemaProps: (settings: FieldSettings) => Record<string, unknown>
  /** Build the uiSchema entry (presentation: ui:widget, ui:placeholder, ui:options). */
  toUiSchemaProps: (settings: FieldSettings) => Record<string, unknown>
  /** Reconstruct settings from both schema property and uiSchema entry. */
  fromSchemaProp: (
    schemaProp: Record<string, unknown>,
    uiProp: Record<string, unknown>
  ) => FieldSettings
  /** Short labels shown as badges on the field card (e.g. "2–50 Zeichen"). */
  settingsChips: (settings: FieldSettings) => string[]
  /** Whether to show the "required" checkbox in the edit dialog. Defaults to true. */
  showRequired?: boolean
}
