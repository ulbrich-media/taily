import { describe, expect, it } from 'vitest'
import {
  activePreset,
  clearFiltersPatch,
  getAdoptionPresets,
  presetPatch,
} from './adoption-list.presets'
import { adoptionListSearchDefaults } from './adoption-list.search'

const PERSON_ID = '0b6f2f0e-6a3a-4a54-9d56-6f3c3b1d2a10'
const presets = getAdoptionPresets(PERSON_ID)
const byKey = (key: string) => presets.find((p) => p.key === key)!
const unassigned = byKey('unassigned')
const myOpen = byKey('my-open')
const archive = byKey('archive')

describe('adoption presets', () => {
  it('sets all filters at once and clears the ones it does not use', () => {
    expect(presetPatch(unassigned)).toMatchObject({
      status: ['pending'],
      mediator_id: 'none',
      animal_type_id: undefined,
      contract_status: [],
    })
  })

  it('applies the personal and archive presets', () => {
    expect(presetPatch(myOpen)).toMatchObject({
      status: ['pending', 'in_progress'],
      mediator_id: PERSON_ID,
    })
    expect(presetPatch(archive)).toMatchObject({
      status: ['done', 'canceled'],
      mediator_id: undefined,
    })
  })

  it('offers no personal preset without a person', () => {
    const keys = getAdoptionPresets(null).map((p) => p.key)
    expect(keys).toEqual(['unassigned', 'archive'])
  })

  it('clears every filter when unchecked', () => {
    const search = {
      ...adoptionListSearchDefaults,
      ...presetPatch(unassigned),
      ...clearFiltersPatch,
    }
    expect(activePreset(search, presets)).toBeUndefined()
    expect(search.status).toEqual([])
    expect(search.mediator_id).toBeUndefined()
  })

  it('is active when exactly its filters are set', () => {
    for (const preset of presets) {
      const search = { ...adoptionListSearchDefaults, ...presetPatch(preset) }
      expect(activePreset(search, presets)).toBe(preset)
    }
  })

  it('ignores the order of the status values', () => {
    const search = {
      ...adoptionListSearchDefaults,
      ...presetPatch(myOpen),
      status: ['in_progress', 'pending'] as ('in_progress' | 'pending')[],
    }
    expect(activePreset(search, presets)).toBe(myOpen)
  })

  it("does not activate another person's my-open preset", () => {
    const search = {
      ...adoptionListSearchDefaults,
      ...presetPatch(myOpen),
    }
    expect(activePreset(search, getAdoptionPresets(null))).toBeUndefined()
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
    expect(activePreset(search, presets)).toBe(unassigned)
  })

  it('is not active with an additional or a missing filter', () => {
    const base = { ...adoptionListSearchDefaults, ...presetPatch(unassigned) }
    expect(
      activePreset({ ...base, animal_type_id: 'type-1' }, presets)
    ).toBeUndefined()
    expect(
      activePreset({ ...base, status: ['pending', 'done'] }, presets)
    ).toBeUndefined()
    expect(
      activePreset({ ...base, mediator_id: undefined }, presets)
    ).toBeUndefined()
    expect(activePreset(adoptionListSearchDefaults, presets)).toBeUndefined()
  })
})
