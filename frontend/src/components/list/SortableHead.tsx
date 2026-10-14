import { ArrowDownZA, ArrowUpAZ, ArrowUpDown } from 'lucide-react'
import { Button } from '@/shadcn/components/ui/button'
import { TableHead } from '@/shadcn/components/ui/table'
import { nextSort, sortDirectionOf, type SortDirection } from './list-search'

interface SortableHeadProps {
  label: string
  /** Sort key without direction prefix, e.g. `animal_name`. */
  sortKey: string
  /** Current sort value, e.g. `-created_at`. */
  sort: string
  onSortChange: (sort: string) => void
  /** Direction applied on the first click. */
  firstDirection?: SortDirection
  className?: string
}

export function SortableHead({
  label,
  sortKey,
  sort,
  onSortChange,
  firstDirection = 'asc',
  className,
}: SortableHeadProps) {
  const direction = sortDirectionOf(sort, sortKey)
  const Icon =
    direction === 'asc'
      ? ArrowUpAZ
      : direction === 'desc'
        ? ArrowDownZA
        : ArrowUpDown

  return (
    <TableHead
      className={className}
      aria-sort={
        direction === 'asc'
          ? 'ascending'
          : direction === 'desc'
            ? 'descending'
            : 'none'
      }
    >
      {/* As in the shadcn data table: a ghost button, pulled left so the
          label lines up with the column's cells. */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-3"
        onClick={() => onSortChange(nextSort(sort, sortKey, firstDirection))}
      >
        {label}
        <Icon />
      </Button>
    </TableHead>
  )
}
