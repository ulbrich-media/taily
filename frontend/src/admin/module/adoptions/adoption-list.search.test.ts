import { describe, expect, it } from 'vitest'
import {
  adoptionListSearchDefaults,
  adoptionListSearchSchema,
  buildAdoptionListQuery,
  hasActiveAdoptionFilters,
  toAdoptionListParams,
} from './adoption-list.search'

describe('adoptionListSearchSchema', () => {
  it('applies defaults to an empty URL', () => {
    expect(adoptionListSearchSchema.parse({})).toEqual(
      adoptionListSearchDefaults
    )
  })

  it('falls back to defaults for invalid values instead of failing', () => {
    const parsed = adoptionListSearchSchema.parse({
      page: -3,
      sort: 'password',
      view: 'grid',
      status: ['done', 'bogus'],
    })
    expect(parsed.page).toBe(1)
    expect(parsed.sort).toBe('-created_at')
    expect(parsed.view).toBe('table')
    expect(parsed.status).toEqual([])
  })
})

describe('buildAdoptionListQuery', () => {
  const params = toAdoptionListParams(adoptionListSearchDefaults)

  it('sends paging and sorting only for the default state', () => {
    const query = new URLSearchParams(buildAdoptionListQuery(params))
    expect(Object.fromEntries(query)).toEqual({
      page: '1',
      per_page: '25',
      sort: '-created_at',
    })
  })

  it('joins multi-value filters with commas and sends single filters as is', () => {
    const query = new URLSearchParams(
      buildAdoptionListQuery({
        ...params,
        page: 2,
        search: ' müller ',
        status: ['pending', 'in_progress'],
        contract_status: ['finished'],
        mediator_id: 'none',
        animal_type_id: 'type-1',
      })
    )
    expect(Object.fromEntries(query)).toMatchObject({
      page: '2',
      search: 'müller',
      'filter[status]': 'pending,in_progress',
      'filter[contract_status]': 'finished',
      'filter[mediator_id]': 'none',
      'filter[animal_type_id]': 'type-1',
    })
    expect(query.has('filter[transport_status]')).toBe(false)
  })

  it('leaves the view out of the request params', () => {
    expect(
      toAdoptionListParams({ ...adoptionListSearchDefaults, view: 'cards' })
    ).not.toHaveProperty('view')
  })
})

describe('hasActiveAdoptionFilters', () => {
  it('ignores sort, view and page', () => {
    expect(
      hasActiveAdoptionFilters({
        ...adoptionListSearchDefaults,
        sort: 'animal_name',
        view: 'cards',
        page: 3,
      })
    ).toBe(false)
  })

  it('detects search and filters', () => {
    expect(
      hasActiveAdoptionFilters({ ...adoptionListSearchDefaults, search: 'x' })
    ).toBe(true)
    expect(
      hasActiveAdoptionFilters({
        ...adoptionListSearchDefaults,
        handover_status: ['finished'],
      })
    ).toBe(true)
  })
})
