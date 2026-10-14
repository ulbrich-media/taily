import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchInput } from './SearchInput'

describe('SearchInput', () => {
  it('applies the term only on submit, not while typing', async () => {
    const onSearch = vi.fn()
    render(<SearchInput label="Suche" value="" onSearch={onSearch} />)

    await userEvent.type(screen.getByRole('searchbox', { name: 'Suche' }), 'mü')
    expect(onSearch).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Suchen' }))
    expect(onSearch).toHaveBeenCalledWith('mü')
  })

  it('applies the term on Enter', async () => {
    const onSearch = vi.fn()
    render(<SearchInput label="Suche" value="" onSearch={onSearch} />)

    await userEvent.type(screen.getByRole('searchbox'), 'luna{Enter}')
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('luna')
  })

  it('clears the search directly when the field is emptied', async () => {
    const onSearch = vi.fn()
    render(<SearchInput label="Suche" value="mü" onSearch={onSearch} />)

    // What the browser's clear button does: empties the field.
    await userEvent.clear(screen.getByRole('searchbox'))
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('')
  })

  it('follows an external reset', () => {
    const { rerender } = render(
      <SearchInput label="Suche" value="mü" onSearch={vi.fn()} />
    )
    rerender(<SearchInput label="Suche" value="" onSearch={vi.fn()} />)
    expect(screen.getByRole('searchbox')).toHaveValue('')
  })
})
