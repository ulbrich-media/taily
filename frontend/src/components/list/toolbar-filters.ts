// Declarative description of the filters in a `ListToolbar`. The toolbar
// decides how to render them: as inline dropdowns, or collapsed into the
// overflow menu when there is not enough room.

export interface FilterOption<T extends string = string> {
  value: T
  label: string
}

/** Several values of one filter, OR-ed, e.g. `filter[status]=pending,done`. */
export interface MultiFilterGroup {
  key: string
  label: string
  options: FilterOption[]
  value: string[]
  onChange: (value: string[]) => void
}

export type ToolbarFilter =
  | ({ type: 'multi' } & MultiFilterGroup)
  /** One value out of many, with an "all" entry for no filter when `allLabel` is set. */
  | {
      type: 'single'
      key: string
      label: string
      /** Text of the unfiltered entry, e.g. "Alle Tierarten". Omit for sort orders. */
      allLabel?: string
      options: FilterOption[]
      value: string | undefined
      onChange: (value: string | undefined) => void
      /** Tint the trigger while a value is selected. Off for the sort order. */
      highlightActive?: boolean
    }
  /** Several multi-value filters combined in one dropdown (sections are AND-ed). */
  | {
      type: 'sections'
      key: string
      label: string
      sections: MultiFilterGroup[]
    }

export function isFilterActive(filter: ToolbarFilter): boolean {
  switch (filter.type) {
    case 'multi':
      return filter.value.length > 0
    case 'single':
      return filter.highlightActive !== false && filter.value !== undefined
    case 'sections':
      return filter.sections.some((section) => section.value.length > 0)
  }
}

/** Value that stands for "no filter" in a radio group. */
export const ALL_VALUE = '__all__'

/** Toggles `option` in a multi-value filter, keeping option order so equal selections give equal URLs. */
export function toggleOption(
  group: MultiFilterGroup,
  option: string,
  checked: boolean
): string[] {
  const selected = new Set(group.value)
  if (checked) selected.add(option)
  else selected.delete(option)
  return group.options
    .map((o) => o.value)
    .filter((value) => selected.has(value))
}
