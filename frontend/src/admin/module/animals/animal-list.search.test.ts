import { describe, expect, it } from 'vitest'
import {
  animalListSearchDefaults,
  animalListSearchSchema,
  buildAnimalListQuery,
  hasActiveAnimalFilters,
  resetSearchPatch,
  toAnimalListParams,
} from './animal-list.search'

const id = '0198a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b'

describe('animalListSearchSchema', () => {
  it('applies defaults to an empty URL', () => {
    expect(animalListSearchSchema.parse({})).toEqual(animalListSearchDefaults)
  })

  it('falls back to defaults for invalid values instead of failing', () => {
    const parsed = animalListSearchSchema.parse({
      page: -3,
      sort: 'password',
      status: ['adopted', 'bogus'],
      published: 'maybe',
      boarding: '0',
      animal_type_id: 'x',
      assigned_agent_id: 'foo',
    })
    expect(parsed).toMatchObject({
      page: 1,
      sort: '-created_at',
      status: [],
      published: undefined,
      boarding: undefined,
      animal_type_id: undefined,
      assigned_agent_id: undefined,
    })
  })

  it('keeps valid values', () => {
    expect(
      animalListSearchSchema.parse({
        assigned_agent_id: 'none',
        animal_type_id: id,
        published: '0',
        has_sponsor: '1',
        sort: '-date_of_birth',
        status: ['open', 'adopted'],
      })
    ).toMatchObject({
      assigned_agent_id: 'none',
      animal_type_id: id,
      published: '0',
      has_sponsor: '1',
      sort: '-date_of_birth',
      status: ['open', 'adopted'],
    })
  })

  it('falls back to an empty search when the term is too long', () => {
    expect(
      animalListSearchSchema.parse({ search: 'a'.repeat(101) }).search
    ).toBe('')
    expect(animalListSearchSchema.parse({ search: '  luna ' }).search).toBe(
      'luna'
    )
  })
})

describe('buildAnimalListQuery', () => {
  const decode = (query: string) =>
    Object.fromEntries(new URLSearchParams(query))

  it('sends only paging and sort without filters', () => {
    expect(
      decode(buildAnimalListQuery(toAnimalListParams(animalListSearchDefaults)))
    ).toEqual({ page: '1', per_page: '25', sort: '-created_at' })
  })

  it('maps every filter to its filter[...] param', () => {
    const query = decode(
      buildAnimalListQuery({
        ...toAnimalListParams(animalListSearchDefaults),
        search: ' luna ',
        status: ['open', 'in_progress'],
        animal_type_id: id,
        assigned_agent_id: 'none',
        published: '1',
        neutered: '0',
        has_image: '1',
        boarding: '1',
        reserved: '1',
        has_sponsor: '1',
      })
    )
    expect(query).toMatchObject({
      search: 'luna',
      'filter[status]': 'open,in_progress',
      'filter[animal_type_id]': id,
      'filter[assigned_agent_id]': 'none',
      'filter[published]': '1',
      'filter[neutered]': '0',
      'filter[has_image]': '1',
      'filter[boarding]': '1',
      'filter[reserved]': '1',
      'filter[has_sponsor]': '1',
    })
  })

  it('uses the given page size', () => {
    expect(
      decode(
        buildAnimalListQuery(toAnimalListParams(animalListSearchDefaults), 8)
      ).per_page
    ).toBe('8')
  })
})

describe('hasActiveAnimalFilters', () => {
  it('ignores sort and page', () => {
    expect(
      hasActiveAnimalFilters({
        ...animalListSearchDefaults,
        sort: 'name',
        page: 3,
      })
    ).toBe(false)
  })

  it('counts search, multi and single filters, including "no"', () => {
    expect(
      hasActiveAnimalFilters({ ...animalListSearchDefaults, search: 'x' })
    ).toBe(true)
    expect(
      hasActiveAnimalFilters({ ...animalListSearchDefaults, status: ['open'] })
    ).toBe(true)
    expect(
      hasActiveAnimalFilters({ ...animalListSearchDefaults, neutered: '0' })
    ).toBe(true)
  })

  it('is cleared by the reset patch', () => {
    const search = {
      ...animalListSearchDefaults,
      search: 'x',
      status: ['open' as const],
      boarding: '1' as const,
      sort: 'name' as const,
      ...resetSearchPatch,
    }
    expect(hasActiveAnimalFilters(search)).toBe(false)
    expect(search.sort).toBe('name')
  })
})
