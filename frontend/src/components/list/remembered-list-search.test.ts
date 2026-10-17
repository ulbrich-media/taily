import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  clearRememberedListSearches,
  isDefaultSearch,
  recallListSearch,
  recallListView,
  rememberListView,
  searchToRestore,
  REMEMBER_MAX_AGE_MS,
  rememberListSearch,
} from './remembered-list-search'

const schema = z.object({
  page: z.number().default(1).catch(1),
  status: z.array(z.enum(['pending', 'done'])).default([]),
})

describe('remembered list search', () => {
  afterEach(() => localStorage.clear())

  it('recalls what was remembered, without the page', () => {
    rememberListSearch('a', { page: 4, status: ['done'] }, 1000)

    expect(recallListSearch('a', schema, 2000)).toEqual({
      page: 1,
      status: ['done'],
    })
  })

  it('recalls nothing for an unknown list', () => {
    expect(recallListSearch('missing', schema)).toBeNull()
  })

  it('ignores and drops entries older than the maximum age', () => {
    rememberListSearch('a', { status: ['done'] }, 1000)

    expect(
      recallListSearch('a', schema, 1000 + REMEMBER_MAX_AGE_MS + 1)
    ).toBeNull()
    expect(localStorage.length).toBe(0)
  })

  it('ignores entries that are no longer valid', () => {
    rememberListSearch('a', { status: ['gone'] }, 1000)

    expect(recallListSearch('a', schema, 2000)).toBeNull()
  })

  it('ignores corrupt entries', () => {
    localStorage.setItem('taily:list-search:a', '{nope')

    expect(recallListSearch('a', schema)).toBeNull()
  })

  it('clears every remembered list', () => {
    rememberListSearch('a', { status: [] })
    rememberListSearch('b', { status: [] })
    localStorage.setItem('theme', 'dark')

    clearRememberedListSearches()

    expect(localStorage.length).toBe(1)
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('treats a search equal to the defaults as empty', () => {
    expect(isDefaultSearch({ a: 1, b: [] }, { a: 1, b: [] })).toBe(true)
    expect(isDefaultSearch({ a: 1, b: ['x'] }, { a: 1, b: [] })).toBe(false)
  })

  describe('searchToRestore', () => {
    const defaults = { page: 1, status: [] as ('pending' | 'done')[] }
    const restore = (cause: string, search = defaults) =>
      searchToRestore({
        cause,
        search,
        defaults,
        key: 'a',
        schema,
        now: 2000,
      })

    it('restores on entering the list without params', () => {
      rememberListSearch('a', { status: ['done'] }, 1000)

      expect(restore('enter')).toEqual({ page: 1, status: ['done'] })
    })

    it('does not restore while moving within the open list', () => {
      rememberListSearch('a', { status: ['done'] }, 1000)

      expect(restore('stay')).toBeNull()
    })

    it('lets explicit params win', () => {
      rememberListSearch('a', { status: ['done'] }, 1000)

      expect(restore('enter', { page: 3, status: [] })).toBeNull()
      expect(restore('enter', { page: 1, status: ['pending'] })).toBeNull()
    })

    it('does nothing when the remembered state is the default', () => {
      rememberListSearch('a', { status: [] }, 1000)

      expect(restore('enter')).toBeNull()
    })

    it('does nothing when nothing is remembered', () => {
      expect(restore('enter')).toBeNull()
    })
  })

  describe('remembered view', () => {
    const viewSchema = z.object({
      page: z.number().default(1),
      view: z.enum(['table', 'cards']).default('table'),
    })
    const defaults = { page: 1, view: 'table' as 'table' | 'cards' }
    const restore = (cause: string, search = defaults, now = 2000) =>
      searchToRestore({
        cause,
        search,
        defaults,
        key: 'v',
        schema: viewSchema,
        now,
      })

    it('stores and recalls the view per list', () => {
      rememberListView('v', 'cards')

      expect(recallListView('v')).toBe('cards')
      expect(recallListView('other')).toBeNull()
    })

    it('ignores an invalid stored view', () => {
      localStorage.setItem('taily:list-view:v', 'grid')

      expect(recallListView('v')).toBeNull()
    })

    it('is saved together with the list search', () => {
      rememberListSearch('v', { page: 2, view: 'cards' })

      expect(recallListView('v')).toBe('cards')
    })

    it('restores the view on entering the list', () => {
      rememberListSearch('v', { view: 'cards' }, 1000)

      expect(restore('enter')).toEqual({ page: 1, view: 'cards' })
    })

    it('restores the view after the remembered search has expired', () => {
      rememberListSearch('v', { view: 'cards' }, 1000)

      const later = 1000 + REMEMBER_MAX_AGE_MS + 1

      expect(restore('enter', defaults, later)).toEqual({
        page: 1,
        view: 'cards',
      })
    })

    it('applies the view to an explicit search without a view', () => {
      rememberListView('v', 'cards')

      expect(restore('enter', { page: 3, view: 'table' })).toEqual({
        page: 3,
        view: 'cards',
      })
    })

    it('lets an explicit view in the URL win', () => {
      rememberListView('v', 'table')

      expect(restore('enter', { page: 1, view: 'cards' })).toBeNull()
    })

    it('does not change the view while moving within the open list', () => {
      rememberListView('v', 'cards')

      expect(restore('stay')).toBeNull()
    })

    it('survives clearing the remembered searches', () => {
      rememberListSearch('v', { view: 'cards' })
      clearRememberedListSearches()

      expect(recallListView('v')).toBe('cards')
    })
  })
})
