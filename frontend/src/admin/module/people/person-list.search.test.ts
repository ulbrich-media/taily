import { describe, expect, it } from 'vitest'
import {
  buildPersonListQuery,
  hasActivePersonFilters,
  isRoleValue,
  personListSearchDefaults,
  personListSearchSchema,
  resetSearchPatch,
  toPersonListParams,
} from './person-list.search'
import { activePreset, personPresets, presetPatch } from './person-list.presets'

const UUID = '3f1c2a52-8d57-4a43-9a3f-0e0c6b1b7a11'

describe('personListSearchSchema', () => {
  it('fills in the defaults', () => {
    expect(personListSearchSchema.parse({})).toEqual(personListSearchDefaults)
  })

  it('falls back to defaults for invalid values', () => {
    const parsed = personListSearchSchema.parse({
      page: 0,
      sort: 'bogus',
      role: ['boss', 'mediator'],
      organization_id: 'nope',
      has_adoptions: 'x',
      adoption_status: ['weird'],
    })
    expect(parsed).toEqual(personListSearchDefaults)
  })

  it('keeps valid roles and sorts them', () => {
    const parsed = personListSearchSchema.parse({
      role: [`mediator:${UUID}`, 'inspector', 'none'],
    })
    expect(parsed.role).toEqual(['inspector', `mediator:${UUID}`, 'none'])
  })
})

describe('isRoleValue', () => {
  it('accepts none, roles and roles for an animal type', () => {
    for (const value of ['none', 'inspector', 'foster', `mediator:${UUID}`]) {
      expect(isRoleValue(value)).toBe(true)
    }
  })

  it('rejects unknown roles and malformed animal types', () => {
    for (const value of ['boss', 'mediator:abc', `mediator:${UUID}:x`, '']) {
      expect(isRoleValue(value)).toBe(false)
    }
  })
})

describe('buildPersonListQuery', () => {
  it('sends page, size and sort only for the defaults', () => {
    const query = new URLSearchParams(
      buildPersonListQuery(toPersonListParams(personListSearchDefaults))
    )
    expect(Object.fromEntries(query)).toEqual({
      page: '1',
      per_page: '25',
      sort: 'name',
    })
  })

  it('joins multi-value filters and trims the search', () => {
    const query = new URLSearchParams(
      buildPersonListQuery({
        ...toPersonListParams(personListSearchDefaults),
        search: '  anna ',
        role: ['inspector', 'none'],
        organization_id: 'none',
        has_adoptions: '0',
        adoption_status: ['done', 'canceled'],
      })
    )
    expect(query.get('search')).toBe('anna')
    expect(query.get('filter[role]')).toBe('inspector,none')
    expect(query.get('filter[organization_id]')).toBe('none')
    expect(query.get('filter[has_adoptions]')).toBe('0')
    expect(query.get('filter[adoption_status]')).toBe('done,canceled')
  })
})

describe('filter state', () => {
  it('knows when filters are active and resets them', () => {
    const active = {
      ...personListSearchDefaults,
      role: ['none'],
      search: 'x',
    }
    expect(hasActivePersonFilters(personListSearchDefaults)).toBe(false)
    expect(hasActivePersonFilters(active)).toBe(true)
    const reset = { ...active, ...resetSearchPatch }
    expect(hasActivePersonFilters(reset)).toBe(false)
  })

  it('does not count the sort as a filter', () => {
    expect(
      hasActivePersonFilters({
        ...personListSearchDefaults,
        sort: '-roles',
      })
    ).toBe(false)
  })
})

describe('presets', () => {
  it.each(personPresets)('$key is active after applying it', (preset) => {
    const search = { ...personListSearchDefaults, ...presetPatch(preset) }
    expect(activePreset(search)?.key).toBe(preset.key)
  })

  it('is not active once another filter is added', () => {
    const archive = personPresets[0]
    const search = {
      ...personListSearchDefaults,
      ...presetPatch(archive),
      has_adoptions: '1' as const,
    }
    expect(activePreset(search)).toBeUndefined()
  })
})
