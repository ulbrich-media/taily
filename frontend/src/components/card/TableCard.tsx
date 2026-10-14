import type { ReactNode } from 'react'
import { Card } from '@/shadcn/components/ui/card'
import { ProgressBar } from '@/components/list/ProgressBar'
import { updatingClass } from '@/components/list/updating'
import { cn } from '@/shadcn/lib/utils'

interface TableCardProps {
  children: ReactNode
  /** The table is being refreshed: a progress bar runs along the top edge and the rows pulse. */
  loading?: boolean
  loadingLabel?: string
  className?: string
}

/**
 * A card that holds nothing but a table. The table runs edge to edge and
 * the card clips it to its rounded corners, so row and header hover
 * backgrounds follow the radius.
 *
 * The progress bar (`ProgressBar`) is positioned over the card's top border,
 * so showing it moves nothing.
 */
export function TableCard({
  children,
  loading = false,
  loadingLabel = 'Wird aktualisiert',
  className,
}: TableCardProps) {
  return (
    <Card
      aria-busy={loading}
      className={cn('relative gap-0 overflow-hidden py-0', className)}
    >
      <ProgressBar
        loading={loading}
        label={loadingLabel}
        className="absolute inset-x-0 top-0"
      />
      {/* `card-edge` table cells restore their padding inside this slot. */}
      <div data-slot="card-table" className={cn(loading && updatingClass)}>
        {children}
      </div>
    </Card>
  )
}
