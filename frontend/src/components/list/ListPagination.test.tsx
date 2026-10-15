import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ListPagination } from './ListPagination'
import { getPageTokens } from './pagination-pages'

describe('getPageTokens', () => {
  it('shows short ranges in full', () => {
    expect(getPageTokens(2, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('collapses the end of a long range', () => {
    expect(getPageTokens(1, 20)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 20])
  })

  it('collapses both sides in the middle', () => {
    expect(getPageTokens(10, 20)).toEqual([
      1,
      'ellipsis-start',
      9,
      10,
      11,
      'ellipsis-end',
      20,
    ])
  })

  it('collapses the start near the last page', () => {
    expect(getPageTokens(20, 20)).toEqual([
      1,
      'ellipsis-start',
      16,
      17,
      18,
      19,
      20,
    ])
  })
})

describe('ListPagination', () => {
  const meta = { current_page: 2, last_page: 5, per_page: 25, total: 110 }

  it('summarises the visible range', () => {
    render(
      <ListPagination
        meta={meta}
        itemLabel="Vermittlungen"
        onPageChange={vi.fn()}
      />
    )
    expect(screen.getByText('26–50 von 110 Vermittlungen')).toBeInTheDocument()
  })

  it('reports the chosen page', async () => {
    const onPageChange = vi.fn()
    render(
      <ListPagination
        meta={meta}
        itemLabel="Vermittlungen"
        onPageChange={onPageChange}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Seite 4' }))
    await userEvent.click(screen.getByRole('button', { name: 'Nächste Seite' }))
    await userEvent.click(
      screen.getByRole('button', { name: 'Vorherige Seite' })
    )

    expect(onPageChange.mock.calls).toEqual([[4], [3], [1]])
  })

  it('disables previous on the first page and hides paging for one page', () => {
    const { rerender } = render(
      <ListPagination
        meta={{ ...meta, current_page: 1 }}
        itemLabel="Vermittlungen"
        onPageChange={vi.fn()}
      />
    )
    expect(
      screen.getByRole('button', { name: 'Vorherige Seite' })
    ).toBeDisabled()

    rerender(
      <ListPagination
        meta={{ ...meta, current_page: 1, last_page: 1, total: 3 }}
        itemLabel="Vermittlungen"
        onPageChange={vi.fn()}
      />
    )
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })
})
