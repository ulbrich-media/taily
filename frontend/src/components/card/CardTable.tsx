import type { ReactNode } from 'react'

/**
 * Sits between `CardContent` and a `Table` so the table reaches the card
 * border. Cancels the horizontal padding of `CardContent`; table cells
 * restore it for their first/last column (see `card-edge` variant).
 */
export function CardTable({ children }: { children: ReactNode }) {
  return (
    <div data-slot="card-table" className="-mx-6">
      {children}
    </div>
  )
}
