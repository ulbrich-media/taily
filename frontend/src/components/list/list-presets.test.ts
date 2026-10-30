import { describe, expect, it } from 'vitest'
import { createPresetHelpers, type ListPreset } from './list-presets'

interface Filters {
  tags: string[]
  owner: string | undefined
}

const NO_FILTERS: Filters = { tags: [], owner: undefined }
const helpers = createPresetHelpers(NO_FILTERS, ['tags', 'owner'])

const presets: ListPreset<Filters>[] = [
  { key: 'ab', label: 'AB', filters: { tags: ['a', 'b'] } },
  { key: 'mine', label: 'Mine', filters: { owner: 'me' } },
]

describe('createPresetHelpers', () => {
  it('clears every filter', () => {
    expect(helpers.clearFiltersPatch).toEqual(NO_FILTERS)
  })

  it('resets all filters before applying a preset', () => {
    expect(helpers.presetPatch(presets[0])).toEqual({
      tags: ['a', 'b'],
      owner: undefined,
    })
  })

  it('detects the preset whose filters match exactly, ignoring order', () => {
    expect(
      helpers.activePreset({ tags: ['b', 'a'], owner: undefined }, presets)?.key
    ).toBe('ab')
  })

  it('does not match when a filter is missing or extra', () => {
    expect(
      helpers.activePreset({ tags: ['a'], owner: undefined }, presets)
    ).toBeUndefined()
    expect(
      helpers.activePreset({ tags: ['a', 'b'], owner: 'me' }, presets)
    ).toBeUndefined()
  })

  it('treats unset filters as empty', () => {
    expect(helpers.activePreset({ owner: 'me' }, presets)?.key).toBe('mine')
  })
})
