import {
  FILTER_KEYS,
  NO_FILTERS,
  type PersonFilterKey,
  type PersonListSearch,
} from './person-list.search'

// Presets are hardcoded bundles of filters (docs/coding-patterns/list-views.md).
// Selecting one writes its filters to the URL; it is not state of its own, it
// shows as active while the URL matches it.

export interface PersonListPreset {
  key: string
  label: string
  filters: Partial<Pick<PersonListSearch, PersonFilterKey>>
}

export const personPresets: PersonListPreset[] = [
  {
    // Applicants without a role whose adoptions are over.
    key: 'archive',
    label: 'Archiv',
    filters: { role: ['none'], adoption_status: ['done', 'canceled'] },
  },
  {
    // Everyone who helps: inspector, foster or mediator.
    key: 'helpers',
    label: 'Helfer',
    filters: { role: ['foster', 'inspector', 'mediator'] },
  },
]

/** The search params that clear every filter, e.g. when the active preset is unchecked. */
export const clearFiltersPatch: Partial<PersonListSearch> = NO_FILTERS

/** The search params to apply for a preset: all filters reset, then the preset's set. */
export function presetPatch(
  preset: PersonListPreset
): Partial<PersonListSearch> {
  return { ...NO_FILTERS, ...preset.filters }
}

const normalize = (value: unknown): string =>
  Array.isArray(value) ? [...value].sort().join(',') : String(value ?? '')

/** The preset whose filters are active exactly, no more and no less. Search, sort and view do not count. */
export function activePreset(
  search: PersonListSearch,
  presets: PersonListPreset[] = personPresets
): PersonListPreset | undefined {
  return presets.find((preset) => {
    const expected = { ...NO_FILTERS, ...preset.filters }
    return FILTER_KEYS.every(
      (key) => normalize(search[key]) === normalize(expected[key])
    )
  })
}
