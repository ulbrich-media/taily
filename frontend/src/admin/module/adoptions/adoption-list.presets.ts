import {
  FILTER_KEYS,
  NO_FILTERS,
  type AdoptionFilterKey,
  type AdoptionListSearch,
} from './adoption-list.search'

// Presets are hardcoded bundles of filters (docs/coding-patterns/list-views.md).
// Selecting one writes its filters to the URL; it is not state of its own, it
// shows as active while the URL matches it.

export interface AdoptionListPreset {
  key: string
  label: string
  filters: Partial<Pick<AdoptionListSearch, AdoptionFilterKey>>
}

export const adoptionPresets: AdoptionListPreset[] = [
  {
    // Fresh applications nobody has picked up yet.
    key: 'unassigned',
    label: 'Neu und ohne Vermittler',
    filters: { status: ['pending'], mediator_id: 'none' },
  },
]

/** The search params that clear every filter, e.g. when the active preset is unchecked. */
export const clearFiltersPatch: Partial<AdoptionListSearch> = NO_FILTERS

/** The search params to apply for a preset: all filters reset, then the preset's set. */
export function presetPatch(
  preset: AdoptionListPreset
): Partial<AdoptionListSearch> {
  return { ...NO_FILTERS, ...preset.filters }
}

const normalize = (value: unknown): string =>
  Array.isArray(value) ? [...value].sort().join(',') : String(value ?? '')

/** The preset whose filters are active exactly, no more and no less. Search, sort and view do not count. */
export function activePreset(
  search: AdoptionListSearch,
  presets: AdoptionListPreset[] = adoptionPresets
): AdoptionListPreset | undefined {
  return presets.find((preset) => {
    const expected = { ...NO_FILTERS, ...preset.filters }
    return FILTER_KEYS.every(
      (key) => normalize(search[key]) === normalize(expected[key])
    )
  })
}
