import { describe, expect, it } from 'vitest'
import {
  buildListQuery,
  createListConfig,
  hasActiveFilters,
  toListParams,
  type BaseListSearch,
} from './list-query'

interface TestSearch extends BaseListSearch {
  tags: string[]
  owner?: string
}

const NO_FILTERS = { tags: [], owner: undefined }

const base: TestSearch = {
  page: 1,
  sort: 'name',
  search: '',
  view: 'table',
  ...NO_FILTERS,
}

const config = { multi: ['tags'], single: ['owner'] } as const

describe('toListParams', () => {
  it('drops the view', () => {
    expect(toListParams({ ...base, view: 'cards' })).not.toHaveProperty('view')
  })
})

describe('buildListQuery', () => {
  it('sends page, per_page and sort only for an unfiltered list', () => {
    expect(buildListQuery(toListParams(base), 10, config)).toBe(
      'page=1&per_page=10&sort=name'
    )
  })

  it('joins multi values with commas and trims the search term', () => {
    const query = new URLSearchParams(
      buildListQuery(
        toListParams({
          ...base,
          search: ' foo ',
          tags: ['a', 'b'],
          owner: 'x',
        }),
        25,
        config
      )
    )
    expect(query.get('search')).toBe('foo')
    expect(query.get('filter[tags]')).toBe('a,b')
    expect(query.get('filter[owner]')).toBe('x')
    expect(query.get('per_page')).toBe('25')
  })
})

describe('hasActiveFilters', () => {
  it('ignores sort, view and page', () => {
    expect(
      hasActiveFilters(
        { ...base, sort: '-name', view: 'cards', page: 3 },
        config
      )
    ).toBe(false)
  })

  it('is true when the search term, a multi or a single filter is set', () => {
    expect(hasActiveFilters({ ...base, search: 'x' }, config)).toBe(true)
    expect(hasActiveFilters({ ...base, tags: ['a'] }, config)).toBe(true)
    expect(hasActiveFilters({ ...base, owner: 'x' }, config)).toBe(true)
  })

  it('treats a blank search term as no filter', () => {
    expect(hasActiveFilters({ ...base, search: '  ' }, config)).toBe(false)
  })
})

describe('createListConfig', () => {
  const list = createListConfig<TestSearch, 'tags' | 'owner'>({
    noFilters: NO_FILTERS,
    perPage: 7,
    multi: ['tags'],
    single: ['owner'],
  })

  it('resets the search term and filters but not sort or view', () => {
    expect(list.resetSearchPatch).toEqual({
      search: '',
      tags: [],
      owner: undefined,
    })
    expect(list.resetSearchPatch).not.toHaveProperty('sort')
    expect(list.resetSearchPatch).not.toHaveProperty('view')
  })

  it('uses its page size unless told otherwise', () => {
    const params = toListParams(base)
    expect(list.buildQuery(params)).toContain('per_page=7')
    expect(list.buildQuery(params, 3)).toContain('per_page=3')
  })

  it('knows whether a search is filtered', () => {
    expect(list.hasActive(base)).toBe(false)
    expect(list.hasActive({ ...base, tags: ['a'] })).toBe(true)
  })
})
