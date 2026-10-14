import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { ListToolbar } from './ListToolbar'
import type { ToolbarFilter } from './toolbar-filters'

const filters: ToolbarFilter[] = ['Status', 'Tierart', 'Vermittler'].map(
  (label) => ({
    type: 'multi',
    key: label,
    label,
    options: [{ value: 'a', label: 'A' }],
    value: [],
    onChange: vi.fn(),
  })
)

// jsdom has no layout: every button is 100px wide, the slot has `slotWidth`.
function mockLayout(slotWidth: number) {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(100)
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(
    slotWidth
  )
}

const visibleButtons = () =>
  within(screen.getByRole('search'))
    .getAllByRole('button')
    .map((button) => button.textContent)

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('ListToolbar', () => {
  it('shows all filters inline when they fit', () => {
    mockLayout(1000)
    render(<ListToolbar label="Filter" filters={filters} />)
    expect(visibleButtons()).toEqual(['Status', 'Tierart', 'Vermittler'])
  })

  it('collapses the filters that do not fit into one overflow button', () => {
    mockLayout(250)
    render(<ListToolbar label="Filter" filters={filters} />)
    expect(visibleButtons()).toEqual(['Status', 'Filter'])
  })

  it('collapses everything when not even one filter fits', () => {
    mockLayout(150)
    render(<ListToolbar label="Filter" filters={filters} />)
    expect(visibleButtons()).toEqual(['Filter'])
  })
})
