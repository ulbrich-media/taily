import {
  createPresetHelpers,
  type ListPreset,
} from '@/components/list/list-presets'
import {
  FILTER_KEYS,
  NO_FILTERS,
  type PersonFilterKey,
  type PersonListSearch,
} from './person-list.search'

// Presets are hardcoded bundles of filters, see components/list/list-presets.

export type PersonListPreset = ListPreset<
  Pick<PersonListSearch, PersonFilterKey>
>

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

const helpers = createPresetHelpers(NO_FILTERS, FILTER_KEYS)

export const { clearFiltersPatch, presetPatch } = helpers

/** The preset whose filters are active exactly, no more and no less. Search, sort and view do not count. */
export function activePreset(
  search: Partial<Pick<PersonListSearch, PersonFilterKey>>,
  presets: PersonListPreset[] = personPresets
): PersonListPreset | undefined {
  return helpers.activePreset(search, presets)
}
