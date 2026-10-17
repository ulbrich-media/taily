import { describe, expect, it } from 'vitest'
import {
  buildUserListQuery,
  hasActiveUserFilters,
  resetSearchPatch,
  toUserListParams,
  userListSearchDefaults,
  userListSearchSchema,
} from './user-list.search'

describe('userListSearchSchema', () => {
  it('falls back to the defaults for an empty URL', () => {
    expect(userListSearchSchema.parse({})).toEqual(userListSearchDefaults)
  })

  it('drops invalid values instead of failing', () => {
    const parsed = userListSearchSchema.parse({
      sort: 'password',
      role: ['owner'],
      has_person: 'maybe',
    })
    expect(parsed.sort).toBe('name')
    expect(parsed.role).toEqual([])
    expect(parsed.has_person).toBeUndefined()
  })
})

describe('buildUserListQuery', () => {
  it('sends the filters, search and sort', () => {
    const query = buildUserListQuery(
      toUserListParams(
        {
          ...userListSearchDefaults,
          sort: '-last_login_at',
          search: ' anna ',
          role: ['admin', 'user'],
          has_person: '0',
          has_two_factor: '0',
          has_logged_in: '1',
        },
        true
      )
    )
    const params = new URLSearchParams(query)
    expect(params.get('sort')).toBe('-last_login_at')
    expect(params.get('search')).toBe('anna')
    expect(params.get('filter[role]')).toBe('admin,user')
    expect(params.get('filter[has_person]')).toBe('0')
    expect(params.get('filter[has_two_factor]')).toBe('0')
    expect(params.get('filter[has_logged_in]')).toBe('1')
  })

  it('drops admin-only sort and filters for non-admins', () => {
    const query = buildUserListQuery(
      toUserListParams(
        {
          ...userListSearchDefaults,
          sort: '-last_login_at',
          has_two_factor: '0',
          has_logged_in: '1',
          has_person: '1',
        },
        false
      )
    )
    const params = new URLSearchParams(query)
    expect(params.get('sort')).toBe('name')
    expect(params.has('filter[has_two_factor]')).toBe(false)
    expect(params.has('filter[has_logged_in]')).toBe(false)
    expect(params.get('filter[has_person]')).toBe('1')
  })
})

describe('hasActiveUserFilters', () => {
  it('counts filters and search, not sort', () => {
    expect(hasActiveUserFilters(userListSearchDefaults)).toBe(false)
    expect(
      hasActiveUserFilters({ ...userListSearchDefaults, sort: '-email' })
    ).toBe(false)
    expect(
      hasActiveUserFilters({ ...userListSearchDefaults, has_person: '0' })
    ).toBe(true)
    expect(
      hasActiveUserFilters({ ...userListSearchDefaults, search: 'x' })
    ).toBe(true)
  })

  it('is cleared by the reset patch', () => {
    const search = {
      ...userListSearchDefaults,
      role: ['admin' as const],
      search: 'x',
      ...resetSearchPatch,
    }
    expect(hasActiveUserFilters(search)).toBe(false)
  })
})
