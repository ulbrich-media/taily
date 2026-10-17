import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  baseListSearchShape,
  fixedOrderListSearchShape,
  multi,
  only,
  sortGuard,
  sortsFor,
  yesNo,
} from './list-schema'

const SORTS = sortsFor(['name', 'created_at'])

const schema = z.object({
  ...baseListSearchShape({ sorts: SORTS, defaultSort: 'name' }),
  tags: multi(['a', 'b']),
  flag: yesNo,
  only: only,
})

describe('sortsFor', () => {
  it('lists every key in both directions', () => {
    expect(SORTS).toEqual(['name', '-name', 'created_at', '-created_at'])
  })
})

describe('sortGuard', () => {
  it('accepts known sorts only', () => {
    const isSort = sortGuard(SORTS)
    expect(isSort('-name')).toBe(true)
    expect(isSort('other')).toBe(false)
  })
})

describe('fixedOrderListSearchShape', () => {
  it('has neither a sort nor, by default, a search', () => {
    const fixed = z.object(fixedOrderListSearchShape())
    expect(fixed.parse({ sort: '-name', search: 'x', page: 3 })).toEqual({
      page: 3,
      sort: '',
      search: '',
      view: 'table',
    })
  })

  it('keeps the search of a searchable list', () => {
    const fixed = z.object(fixedOrderListSearchShape({ searchable: true }))
    expect(fixed.parse({ sort: '-name', search: 'x' })).toMatchObject({
      sort: '',
      search: 'x',
    })
  })
})

describe('baseListSearchShape', () => {
  it('falls back to defaults', () => {
    expect(schema.parse({})).toEqual({
      page: 1,
      sort: 'name',
      search: '',
      view: 'table',
      tags: [],
      flag: undefined,
      only: undefined,
    })
  })

  it('falls back for invalid values instead of failing', () => {
    const parsed = schema.parse({
      page: 0,
      sort: 'bogus',
      view: 'grid',
      search: 'x'.repeat(101),
      tags: ['a', 'zzz'],
      flag: '2',
      only: '0',
    })
    expect(parsed).toMatchObject({
      page: 1,
      sort: 'name',
      view: 'table',
      search: '',
      tags: [],
      flag: undefined,
      only: undefined,
    })
  })

  it('keeps valid values and trims the search term', () => {
    expect(
      schema.parse({
        page: 2,
        sort: '-created_at',
        view: 'cards',
        search: ' hi ',
        tags: ['b'],
        flag: '0',
        only: '1',
      })
    ).toEqual({
      page: 2,
      sort: '-created_at',
      view: 'cards',
      search: 'hi',
      tags: ['b'],
      flag: '0',
      only: '1',
    })
  })
})
