import { describe, expect, it } from 'vitest'
import {
  activePreset,
  clearFiltersPatch,
  getAnimalPresets,
  presetPatch,
} from './animal-list.presets'
import { animalListSearchDefaults } from './animal-list.search'

const PERSON_ID = '0b6f2f0e-6a3a-4a54-9d56-6f3c3b1d2a10'
const presets = getAnimalPresets(PERSON_ID)
const myAssigned = presets[0]

describe('animal presets', () => {
  it('offers no preset without a person', () => {
    expect(getAnimalPresets(null)).toEqual([])
  })

  it('sets all filters at once and clears the ones it does not use', () => {
    expect(presetPatch(myAssigned)).toMatchObject({
      status: ['open', 'in_progress'],
      assigned_agent_id: PERSON_ID,
      animal_type_id: undefined,
      published: undefined,
    })
  })

  it('clears every filter when unchecked', () => {
    const search = {
      ...animalListSearchDefaults,
      ...presetPatch(myAssigned),
      ...clearFiltersPatch,
    }
    expect(activePreset(search, presets)).toBeUndefined()
    expect(search.status).toEqual([])
    expect(search.assigned_agent_id).toBeUndefined()
  })

  it('is active when exactly its filters are set, in any status order', () => {
    const search = { ...animalListSearchDefaults, ...presetPatch(myAssigned) }
    expect(activePreset(search, presets)).toBe(myAssigned)
    expect(
      activePreset({ ...search, status: ['in_progress', 'open'] }, presets)
    ).toBe(myAssigned)
  })

  it('stays active when only search, sort, view or page differ', () => {
    const search = {
      ...animalListSearchDefaults,
      ...presetPatch(myAssigned),
      search: 'luna',
      sort: 'name' as const,
      view: 'cards' as const,
      page: 3,
    }
    expect(activePreset(search, presets)).toBe(myAssigned)
  })

  it('is not active with an additional or a missing filter', () => {
    const base = { ...animalListSearchDefaults, ...presetPatch(myAssigned) }
    expect(activePreset({ ...base, published: '1' }, presets)).toBeUndefined()
    expect(activePreset({ ...base, status: ['open'] }, presets)).toBeUndefined()
    expect(
      activePreset({ ...base, assigned_agent_id: undefined }, presets)
    ).toBeUndefined()
    expect(activePreset(animalListSearchDefaults, presets)).toBeUndefined()
  })
})
