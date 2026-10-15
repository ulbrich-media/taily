import {
  createPresetHelpers,
  type ListPreset,
} from '@/components/list/list-presets'
import {
  FILTER_KEYS,
  NO_FILTERS,
  type AdoptionFilterKey,
  type AdoptionListSearch,
} from './adoption-list.search'

// Presets are hardcoded bundles of filters, see components/list/list-presets.

export type AdoptionListPreset = ListPreset<
  Pick<AdoptionListSearch, AdoptionFilterKey>
>

/** The presets for the current user. Personal ones need the user's person id. */
export function getAdoptionPresets(
  personId: string | null
): AdoptionListPreset[] {
  const mine: AdoptionListPreset[] = personId
    ? [
        {
          key: 'my-open',
          label: 'Meine offenen Vermittlungen',
          filters: {
            status: ['pending', 'in_progress'],
            mediator_id: personId,
          },
        },
      ]
    : []
  return [
    {
      // Fresh applications nobody has picked up yet.
      key: 'unassigned',
      label: 'Neu und ohne Vermittler',
      filters: { status: ['pending'], mediator_id: 'none' },
    },
    ...mine,
    {
      key: 'archive',
      label: 'Archiv',
      filters: { status: ['done', 'canceled'] },
    },
  ]
}

export const { clearFiltersPatch, presetPatch, activePreset } =
  createPresetHelpers(NO_FILTERS, FILTER_KEYS)
