import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { clearRememberedListSearches } from './remembered-list-search'
import { recallListView, rememberListView, useListView } from './list-view'

describe('list view', () => {
  afterEach(() => localStorage.clear())

  it('stores and recalls the view per list', () => {
    rememberListView('v', 'cards')

    expect(recallListView('v')).toBe('cards')
    expect(recallListView('other')).toBeNull()
  })

  it('ignores an invalid stored view', () => {
    localStorage.setItem('taily:list-view:v', 'grid')

    expect(recallListView('v')).toBeNull()
  })

  it('survives clearing the remembered searches', () => {
    rememberListView('v', 'cards')
    clearRememberedListSearches()

    expect(recallListView('v')).toBe('cards')
  })

  it('defaults to the table', () => {
    const { result } = renderHook(() => useListView('v'))

    expect(result.current.view).toBe('table')
  })

  it('starts with the remembered view and follows changes', () => {
    rememberListView('v', 'cards')
    const { result } = renderHook(() => useListView('v'))

    expect(result.current.view).toBe('cards')

    act(() => result.current.setView('table'))

    expect(result.current.view).toBe('table')
    expect(recallListView('v')).toBe('table')
  })
})
