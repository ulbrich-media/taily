import * as React from 'react'
import { Popover as PopoverPrimitive } from 'radix-ui'
import { CheckIcon, ChevronDownIcon, XIcon } from 'lucide-react'

import { cn } from '@/shadcn/lib/utils'

export interface ComboSelectProps<T> {
  /** Full list of selectable items. */
  items: T[]
  /** Currently selected value (string id), or null when nothing is selected. */
  value: string | null
  /** Called with the selected item's value string. */
  onValueChange: (value: string | null) => void
  /** Returns the stable string identifier for an item. */
  getItemValue: (item: T) => string
  /** Returns the text that is matched against the search query. */
  getItemSearchText: (item: T) => string
  /** Renders a list item */
  renderListItem: (item: T) => React.ReactNode
  /** Renders a button item */
  renderButtonItem: (item: T) => React.ReactNode
  placeholder?: string
  disabled?: boolean
  className?: string
  /** Forwarded to the trigger button for form-field label association. */
  id?: string
  'aria-invalid'?: boolean
}

export function ComboSelect<T>({
  items,
  value,
  onValueChange,
  getItemValue,
  getItemSearchText,
  renderListItem,
  renderButtonItem,
  placeholder = 'Auswählen...',
  disabled = false,
  className,
  id,
  'aria-invalid': ariaInvalid,
}: ComboSelectProps<T>) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  const searchRef = React.useRef<HTMLInputElement>(null)
  const itemRefs = React.useRef<(HTMLButtonElement | null)[]>([])

  const selectedItem = value
    ? (items.find((item) => getItemValue(item) === value) ?? null)
    : null

  const filteredItems = search.trim()
    ? items.filter((item) =>
        getItemSearchText(item).toLowerCase().includes(search.toLowerCase())
      )
    : items

  const handleSelect = (itemValue: string) => {
    onValueChange(itemValue)
    setOpen(false)
    setSearch('')
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) setSearch('')
    setOpen(next)
  }

  // Arrow-down in the search field moves focus to the first list item.
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const first = itemRefs.current[0]
      if (first) {
        first.focus()
        first.scrollIntoView({ block: 'nearest' })
      }
    }
  }

  // Arrow navigation inside the list; ArrowUp on the first item returns to search.
  const handleItemKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = itemRefs.current[index + 1]
      if (next) {
        next.focus()
        next.scrollIntoView({ block: 'nearest' })
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (index === 0) {
        searchRef.current?.focus()
      } else {
        const prev = itemRefs.current[index - 1]
        if (prev) {
          prev.focus()
          prev.scrollIntoView({ block: 'nearest' })
        }
      }
    }
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            "border-input [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          <span className="flex-1 truncate text-left">
            {selectedItem ? (
              renderButtonItem(selectedItem)
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Content
        side="bottom"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          searchRef.current?.focus()
        }}
        style={{ width: 'var(--radix-popover-trigger-width)' }}
        className={cn(
          'bg-popover/90 text-popover-foreground backdrop-blur-lg',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
          'z-50 flex max-h-[min(20rem,var(--radix-popover-content-available-height,20rem))] flex-col overflow-hidden rounded-md border shadow-md'
        )}
      >
        {/* Search row */}
        <div className="shrink-0 border-b">
          <div className="flex items-center px-1">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Suchen…"
              className="placeholder:text-muted-foreground flex-1 bg-transparent px-2 py-2 text-sm outline-none"
            />
            {search && (
              <button
                type="button"
                tabIndex={-1}
                onClick={() => {
                  setSearch('')
                  searchRef.current?.focus()
                }}
                className="hover:bg-accent rounded-sm p-1"
              >
                <XIcon className="text-muted-foreground size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Item list */}
        <div
          role="listbox"
          className="min-h-0 flex-1 scroll-py-1 overflow-y-auto p-1"
        >
          {filteredItems.length === 0 ? (
            <div className="text-muted-foreground py-2 text-center text-sm">
              Keine Ergebnisse
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const itemValue = getItemValue(item)
              const isSelected = itemValue === value
              return (
                <button
                  key={itemValue}
                  ref={(el) => {
                    itemRefs.current[index] = el
                  }}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(itemValue)}
                  onKeyDown={(e) => handleItemKeyDown(e, index)}
                  className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex items-center w-full relative text-left cursor-default gap-2 rounded-sm py-1.5 px-2 text-sm outline-none select-none"
                >
                  <span className="flex-1">{renderListItem(item)}</span>
                  <span
                    className={cn('pointer-events-none', {
                      'opacity-0': !isSelected,
                    })}
                  >
                    <CheckIcon className="size-4" />
                  </span>
                </button>
              )
            })
          )}
        </div>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  )
}
