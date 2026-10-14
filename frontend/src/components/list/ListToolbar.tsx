import { useRef, type FormEvent, type ReactNode } from 'react'
import { FilterX } from 'lucide-react'
import { Button } from '@/shadcn/components/ui/button'
import {
  FilterDropdown,
  FilterOverflowMenu,
  FilterTrigger,
} from './FilterDropdown'
import { isFilterActive, type ToolbarFilter } from './toolbar-filters'
import { useFittingCount } from './useFittingCount'

interface ListToolbarProps {
  /** Accessible name of the filter form. */
  label: string
  /** Search field, e.g. `SearchInput`. */
  search?: ReactNode
  /** Filters in priority order: the last ones collapse first. */
  filters: ToolbarFilter[]
  /** Clears search and filters. Shown as icon button, disabled while `canReset` is false. */
  onReset?: () => void
  canReset?: boolean
  /** Controls that never collapse, e.g. sort order and view switch. */
  trailing?: ReactNode
  /** Name of the overflow button. */
  overflowLabel?: string
}

/**
 * Filter bar above a list view.
 *
 * - Mobile: the search takes its own full-width row, the filters sit on the
 *   row below.
 * - From `md` up: search on the left, the filters right-aligned after a
 *   flexible gap, all on one row.
 * - The reset button always sits behind the last filter (or the overflow
 *   button), before the trailing controls.
 * - Filters that do not fit the available width collapse, in order, into a
 *   single "Filter" button whose menu has one submenu per filter. There is
 *   never a second line or horizontal scrolling.
 *
 * Filters apply on change, so this is a form only for semantics.
 */
export function ListToolbar({
  label,
  search,
  filters,
  onReset,
  canReset = false,
  trailing,
  overflowLabel = 'Filter',
}: ListToolbarProps) {
  const slotRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const fitting = useFittingCount(slotRef, measureRef, filters.length)

  const inline = filters.slice(0, fitting)
  const collapsed = filters.slice(fitting)

  return (
    <form
      role="search"
      aria-label={label}
      onSubmit={(event: FormEvent) => event.preventDefault()}
      className="flex flex-wrap items-center gap-2"
    >
      {search && (
        <div className="w-full md:w-60 xl:w-72 md:shrink-0">{search}</div>
      )}

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div ref={slotRef} className="relative min-w-0 flex-1">
          <div className="flex items-center gap-2 md:justify-end">
            {inline.map((filter) => (
              <FilterDropdown key={filter.key} filter={filter} />
            ))}
            {collapsed.length > 0 && (
              <FilterOverflowMenu filters={collapsed} label={overflowLabel} />
            )}
          </div>

          {/* Natural widths of all filters and the overflow button, measured
              to decide what fits. Clipped to the slot: when the strip is
              wider than the slot (exactly when filters collapse), it must
              not widen the page. */}
          <div
            aria-hidden
            inert
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div
              ref={measureRef}
              className="invisible flex h-0 w-max items-center gap-2"
            >
              {filters.map((filter) => (
                <FilterTrigger
                  key={filter.key}
                  label={filter.label}
                  active={isFilterActive(filter)}
                  tabIndex={-1}
                />
              ))}
              <FilterTrigger
                label={overflowLabel}
                active
                withIcon
                tabIndex={-1}
              />
            </div>
          </div>
        </div>

        {onReset && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Filter zurücksetzen"
            disabled={!canReset}
            onClick={onReset}
          >
            <FilterX />
          </Button>
        )}

        {trailing && (
          <div className="flex shrink-0 items-center gap-2">{trailing}</div>
        )}
      </div>
    </form>
  )
}
