import { describe, expect, it } from 'vitest'
import {
  activePreset,
  adoptionPresets,
  clearFiltersPatch,
  presetPatch,
} from './adoption-list.presets'
import { adoptionListSearchDefaults } from './adoption-list.search'

const unassigned = adoptionPresets[0]

describe('adoption presets', () => {
  it('sets all filters at once and clears the ones it does not use', () => {
    expect(presetPatch(unassigned)).toMatchObject({
      status: ['pending'],
      mediator_id: 'none',
      animal_type_id: undefined,
      contract_status: [],
    })
  })

  it('clears every filter when unchecked', () => {
    const search = {
      ...adoptionListSearchDefaults,
      ...presetPatch(unassigned),
      ...clearFiltersPatch,
    }
    expect(activePreset(search)).toBeUndefined()
    expect(search.status).toEqual([])
    expect(search.mediator_id).toBeUndefined()
  })

  it('is active when exactly its filters are set', () => {
    const search = { ...adoptionListSearchDefaults, ...presetPatch(unassigned) }
    expect(activePreset(search)).toBe(unassigned)
  })

  it('stays active when only search, sort, view or page differ', () => {
    const search = {
      ...adoptionListSearchDefaults,
      ...presetPatch(unassigned),
      search: 'luna',
      sort: 'animal_name' as const,
      view: 'cards' as const,
      page: 3,
    }
    expect(activePreset(search)).toBe(unassigned)
  })

  it('is not active with an additional or a missing filter', () => {
    const base = { ...adoptionListSearchDefaults, ...presetPatch(unassigned) }
    expect(activePreset({ ...base, animal_type_id: 'type-1' })).toBeUndefined()
    expect(
      activePreset({ ...base, status: ['pending', 'done'] })
    ).toBeUndefined()
    expect(activePreset({ ...base, mediator_id: undefined })).toBeUndefined()
    expect(activePreset(adoptionListSearchDefaults)).toBeUndefined()
  })
})
