// Declarative description of the filters in a `ListToolbar`. The toolbar
// decides how to render them: as inline dropdowns, or collapsed into the
// overflow menu when there is not enough room.

export interface FilterOption<T extends string = string> {
  value: T
  label: string
  /** A general choice (e.g. "none") shown above a divider, apart from the specific options. */
  general?: boolean
}

// `onChange` is declared as a method on purpose: method parameters are
// compared bivariantly, so a filter over `'a' | 'b'` can be put into a
// `ToolbarFilter[]` without casts. Use `defineFilter` / `defineGroup` to
// have the value type inferred from the options.

/** Several values of one filter, OR-ed, e.g. `filter[status]=pending,done`. */
export interface MultiFilterGroup<T extends string = string> {
  key: string
  label: string
  options: FilterOption<T>[]
  value: T[]
  onChange(value: T[]): void
}

export type ToolbarFilter<T extends string = string> =
  | ({ type: 'multi' } & MultiFilterGroup<T>)
  /** One value out of many, with an "all" entry for no filter when `allLabel` is set. */
  | {
      type: 'single'
      key: string
      label: string
      /** Text of the unfiltered entry, e.g. "Alle Tierarten". Omit for sort orders. */
      allLabel?: string
      options: FilterOption<T>[]
      value: T | undefined
      onChange(value: T | undefined): void
      /** Show the filter as active while a value is selected. Off for the sort order, which always has one. */
      highlightActive?: boolean
    }
  /** Several multi-value filters combined in one dropdown (sections are AND-ed). */
  | {
      type: 'sections'
      key: string
      label: string
      sections: SectionGroup[]
    }

/** A section of a `sections` filter; without a `label` it has no headline. */
export type SectionGroup<T extends string = string> = Omit<
  MultiFilterGroup<T>,
  'label'
> & { label?: string }

/** Types a filter by its options and widens it for use in a `ToolbarFilter[]`. */
export function defineFilter<T extends string>(
  filter: ToolbarFilter<T>
): ToolbarFilter {
  return filter as ToolbarFilter
}

/** Same for one section of a `sections` filter. */
export function defineGroup<T extends string>(
  group: SectionGroup<T>
): SectionGroup {
  return group as SectionGroup
}

/** A yes/no filter in a checkbox section: at most one of the two is set, checking the other one switches, unchecking clears. */
export function yesNoGroup<K extends string>(
  key: K,
  options: FilterOption<'1' | '0'>[],
  current: '1' | '0' | undefined,
  onChange: (patch: Record<K, '1' | '0' | undefined>) => void
): SectionGroup {
  return defineGroup({
    key,
    options,
    value: current ? [current] : [],
    onChange: (values) =>
      onChange({ [key]: values.find((v) => v !== current) } as Record<
        K,
        '1' | '0' | undefined
      >),
  })
}

/**
 * The "Schnellfilter" dropdown: independent checkbox items that behave like
 * radios. At most one preset matches at a time, and unchecking it clears the
 * filters.
 */
export function presetFilter<P extends { key: string; label: string }>({
  presets,
  current,
  onPick,
  onClear,
}: {
  presets: P[]
  /** Key of the preset that matches the URL, if any. */
  current: string | undefined
  onPick: (preset: P) => void
  onClear: () => void
}): ToolbarFilter {
  return defineFilter({
    type: 'multi',
    key: 'preset',
    label: 'Schnellfilter',
    options: presets.map((preset) => ({
      value: preset.key,
      label: preset.label,
    })),
    value: current ? [current] : [],
    onChange: (keys: string[]) => {
      const picked = keys.find((key) => key !== current)
      const preset = presets.find((p) => p.key === picked)
      if (preset) onPick(preset)
      else onClear()
    },
  })
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
  group: Pick<MultiFilterGroup, 'options' | 'value'>,
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
