import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  clearRememberedListSearches,
  isDefaultSearch,
  recallListSearch,
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
})
