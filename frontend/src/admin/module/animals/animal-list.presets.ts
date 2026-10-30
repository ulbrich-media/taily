import {
  createPresetHelpers,
  type ListPreset,
} from '@/components/list/list-presets'
import {
  FILTER_KEYS,
  NO_FILTERS,
  type AnimalFilterKey,
  type AnimalListSearch,
} from './animal-list.search'

// Presets are hardcoded bundles of filters, see components/list/list-presets.

export type AnimalListPreset = ListPreset<
  Pick<AnimalListSearch, AnimalFilterKey>
>

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

export const { clearFiltersPatch, presetPatch, activePreset } =
  createPresetHelpers(NO_FILTERS, FILTER_KEYS)
