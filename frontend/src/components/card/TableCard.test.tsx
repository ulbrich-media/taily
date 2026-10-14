import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TableCard } from './TableCard'

describe('TableCard', () => {
  it('shows no progress bar while idle', () => {
    render(
      <TableCard>
        <p>Zeilen</p>
      </TableCard>
    )
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.getByText('Zeilen')).toBeInTheDocument()
  })

  it('marks the card busy while loading and shows the bar after a short delay', async () => {
    const { container } = render(
      <TableCard loading>
        <p>Zeilen</p>
      </TableCard>
    )
    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true')
    expect(
      await screen.findByRole('progressbar', { name: 'Wird aktualisiert' })
    ).toBeInTheDocument()
  })
})
