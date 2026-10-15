import {
  FILTER_KEYS,
  NO_FILTERS,
  type AnimalFilterKey,
  type AnimalListSearch,
} from './animal-list.search'

// Presets are hardcoded bundles of filters (docs/coding-patterns/list-views.md).
// Selecting one writes its filters to the URL; it is not state of its own, it
// shows as active while the URL matches it.

export interface AnimalListPreset {
  key: string
  label: string
  filters: Partial<Pick<AnimalListSearch, AnimalFilterKey>>
}

/** The presets for the current user. Personal ones need the user's person id. */
export function getAnimalPresets(personId: string | null): AnimalListPreset[] {
  if (!personId) return []
  return [
    {
      // Animals the user looks after that are not adopted yet.
      key: 'my-assigned',
      label: 'Meine zugewiesenen Tiere',
      filters: { status: ['open', 'in_progress'], assigned_agent_id: personId },
    },
  ]
}

/** The search params that clear every filter, e.g. when the active preset is unchecked. */
export const clearFiltersPatch: Partial<AnimalListSearch> = NO_FILTERS

/** The search params to apply for a preset: all filters reset, then the preset's set. */
export function presetPatch(
  preset: AnimalListPreset
): Partial<AnimalListSearch> {
  return { ...NO_FILTERS, ...preset.filters }
}

const normalize = (value: unknown): string =>
  Array.isArray(value) ? [...value].sort().join(',') : String(value ?? '')

/** The preset whose filters are active exactly, no more and no less. Search, sort and view do not count. */
export function activePreset(
  search: AnimalListSearch,
  presets: AnimalListPreset[]
): AnimalListPreset | undefined {
  return presets.find((preset) => {
    const expected = { ...NO_FILTERS, ...preset.filters }
    return FILTER_KEYS.every(
      (key) => normalize(search[key]) === normalize(expected[key])
    )
  })
}
