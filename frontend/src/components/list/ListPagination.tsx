import type { PaginationMeta } from '@/api/types/pagination'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/shadcn/components/ui/pagination'
import { getPageTokens } from './pagination-pages'

interface ListPaginationProps {
  meta: PaginationMeta
  onPageChange: (page: number) => void
  /** Noun used in the summary, e.g. "Vermittlungen". */
  itemLabel: string
}

export function ListPagination({
  meta,
  onPageChange,
  itemLabel,
}: ListPaginationProps) {
  const { current_page, last_page, per_page, total } = meta
  const from = total === 0 ? 0 : (current_page - 1) * per_page + 1
  const to = Math.min(current_page * per_page, total)

  return (
    <div className="flex flex-col items-center gap-3 md:flex-row md:justify-between">
      <p className="text-sm text-muted-foreground">
        {from}–{to} von {total} {itemLabel}
      </p>
      {last_page > 1 && (
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                disabled={current_page <= 1}
                onClick={() => onPageChange(current_page - 1)}
              />
            </PaginationItem>
            {getPageTokens(current_page, last_page).map((token) => (
              <PaginationItem key={token}>
                {typeof token === 'number' ? (
                  <PaginationLink
                    isActive={token === current_page}
                    aria-label={`Seite ${token}`}
                    onClick={() => onPageChange(token)}
                  >
                    {token}
                  </PaginationLink>
                ) : (
                  <PaginationEllipsis />
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                disabled={current_page >= last_page}
                onClick={() => onPageChange(current_page + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
