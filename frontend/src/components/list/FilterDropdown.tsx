import type { ComponentProps } from 'react'
import { ChevronDown, Funnel } from 'lucide-react'
import { Button } from '@/shadcn/components/ui/button'
import { CircleIcon } from '@/components/icons/circle'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/shadcn/components/ui/dropdown-menu'
import {
  ALL_VALUE,
  isFilterActive,
  toggleOption,
  type MultiFilterGroup,
  type ToolbarFilter,
} from './toolbar-filters'

/** The mark of an active filter: the dot is decoration, so say it in text as well. */
function ActiveDot() {
  return (
    <>
      <CircleIcon className="text-primary" />
      <span className="sr-only">(aktiv)</span>
    </>
  )
}

/** Trigger showing only the filter's name; a primary-coloured dot marks an active filter. */
export function FilterTrigger({
  label,
  active,
  withIcon,
  ...props
}: {
  label: string
  active: boolean
  withIcon?: boolean
} & Omit<ComponentProps<typeof Button>, 'children'>) {
  return (
    <Button type="button" size="sm" variant="ghost" {...props}>
      {withIcon && <Funnel />}
      {label}
      {active ? <ActiveDot /> : <ChevronDown />}
    </Button>
  )
}

function MultiItems({ group }: { group: Omit<MultiFilterGroup, 'label'> }) {
  return group.options.map((option) => (
    <DropdownMenuCheckboxItem
      key={option.value}
      checked={group.value.includes(option.value)}
      onCheckedChange={(checked) =>
        group.onChange(toggleOption(group, option.value, checked))
      }
      // Keep the menu open so several values can be picked in a row.
      onSelect={(event) => event.preventDefault()}
    >
      {option.label}
    </DropdownMenuCheckboxItem>
  ))
}

/** The menu entries of a filter, shared by its own dropdown and the overflow submenu. */
function FilterMenuItems({ filter }: { filter: ToolbarFilter }) {
  switch (filter.type) {
    case 'multi':
      return <MultiItems group={filter} />
    case 'single':
      return (
        <DropdownMenuRadioGroup
          value={filter.value ?? ALL_VALUE}
          onValueChange={(next) =>
            filter.onChange(next === ALL_VALUE ? undefined : next)
          }
        >
          {filter.allLabel !== undefined && (
            <DropdownMenuRadioItem value={ALL_VALUE}>
              {filter.allLabel}
            </DropdownMenuRadioItem>
          )}
          {filter.options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      )
    case 'sections':
      return filter.sections.map((section, index) => (
        <DropdownMenuGroup key={section.key}>
          {index > 0 && <DropdownMenuSeparator />}
          {section.label && (
            <DropdownMenuLabel>{section.label}</DropdownMenuLabel>
          )}
          <MultiItems group={section} />
        </DropdownMenuGroup>
      ))
  }
}

export function FilterDropdown({ filter }: { filter: ToolbarFilter }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <FilterTrigger label={filter.label} active={isFilterActive(filter)} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <FilterMenuItems filter={filter} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Holds the filters that do not fit inline, each as a submenu. */
export function FilterOverflowMenu({
  filters,
  label,
}: {
  filters: ToolbarFilter[]
  label: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <FilterTrigger
          label={label}
          withIcon
          active={filters.some(isFilterActive)}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {filters.map((filter) => (
          <DropdownMenuSub key={filter.key}>
            <DropdownMenuSubTrigger>
              {filter.label}
              {isFilterActive(filter) && <ActiveDot />}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <FilterMenuItems filter={filter} />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
