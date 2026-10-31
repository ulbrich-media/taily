import type {
  CustomFieldEntity,
  LinkableField,
} from '@/api/types/custom-fields'
import type { FieldLink, LinkedSettings } from '../api/types'
import type { EditorField } from './shared/EditorField'

// A "Feld übernehmen" field copies a person or animal field into a template.
// The copy is self-contained: renderers see a normal property. Only the
// builder knows about the link, via `ui:options.link` in the ui_schema.
// See "Linked fields" in docs/features/custom-fields.md.

export const LINK_ENTITY_LABELS: Record<CustomFieldEntity, string> = {
  person: 'Person',
  animal: 'Tier',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** The link recorded in a ui_schema entry, if any. */
export function getFieldLink(
  uiProp: Record<string, unknown>
): FieldLink | null {
  const options = uiProp['ui:options']
  if (!isRecord(options) || !isRecord(options.link)) return null
  const { entity, field } = options.link
  if ((entity !== 'person' && entity !== 'animal') || typeof field !== 'string')
    return null
  return { entity, field }
}

/** Splits a property + ui_schema entry into the settings of a linked field. */
export function linkedSettingsFrom(
  schemaProp: Record<string, unknown>,
  uiProp: Record<string, unknown>
): LinkedSettings {
  // The description is edited on the field itself (see parseJsonSchema).
  const { description: _description, ...schema } = schemaProp
  const {
    'ui:title': _title,
    'ui:placeholder': placeholder,
    'ui:options': options,
    ...ui
  } = uiProp
  if (isRecord(options)) {
    const { link: _link, ...rest } = options
    if (Object.keys(rest).length > 0) ui['ui:options'] = rest
  }
  return {
    link: getFieldLink(uiProp) ?? undefined,
    schema,
    ui,
    placeholder:
      typeof placeholder === 'string' && placeholder ? placeholder : undefined,
  }
}

/** The ui_schema entry of a linked field, without `ui:title`. */
export function linkedUiSchemaProps(
  settings: LinkedSettings
): Record<string, unknown> {
  const prop: Record<string, unknown> = { ...settings.ui }
  if (settings.placeholder) prop['ui:placeholder'] = settings.placeholder
  if (settings.link) {
    const options = isRecord(prop['ui:options']) ? prop['ui:options'] : {}
    prop['ui:options'] = { ...options, link: { ...settings.link } }
  }
  return prop
}

/** A new editor field copied from a linkable field. */
export function editorFieldFromSource(source: LinkableField): EditorField {
  const ui = source.ui_schema
  const description = source.schema.description
  return {
    id: source.key,
    type: 'linked',
    label: typeof ui['ui:title'] === 'string' ? ui['ui:title'] : source.label,
    description: typeof description === 'string' ? description : undefined,
    required: false,
    settings: linkedSettingsFrom(source.schema, ui),
  }
}

/** Option label in the picker, e.g. "Ausweisnummer (Zusatzfeld: Ausweis)". */
export function linkableFieldLabel(source: LinkableField): string {
  if (source.kind === 'custom') {
    return source.group
      ? `${source.label} (Zusatzfeld: ${source.group})`
      : `${source.label} (Zusatzfeld)`
  }
  return source.label
}

export function findLinkSource(
  link: FieldLink,
  linkable: LinkableField[]
): LinkableField | undefined {
  return linkable.find((f) => f.field === link.field)
}

export type LinkSourceStatus = 'current' | 'changed' | 'removed'

const COMPARED_KEYS = ['type', 'format', 'enum'] as const

/**
 * Whether the copied fragment still matches its source. Only `type`, `format`
 * and `enum` count; wording and constraints may differ on purpose.
 */
export function linkSourceStatus(
  settings: LinkedSettings,
  linkable: LinkableField[]
): LinkSourceStatus {
  if (!settings.link) return 'current'
  const source = findLinkSource(settings.link, linkable)
  if (!source) return 'removed'
  const differs = COMPARED_KEYS.some(
    (key) =>
      JSON.stringify(settings.schema[key] ?? null) !==
      JSON.stringify(source.schema[key] ?? null)
  )
  return differs ? 'changed' : 'current'
}

/**
 * Re-copies the source fragment into a linked field, keeping what the form
 * rewords: key, label, description, placeholder and required.
 */
export function recopyLinkedField(
  field: EditorField,
  source: LinkableField
): EditorField {
  const current = field.settings as LinkedSettings
  const copied = linkedSettingsFrom(source.schema, source.ui_schema)
  return {
    ...field,
    settings: { ...copied, placeholder: current.placeholder },
  }
}
