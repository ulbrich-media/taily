// Presets are hardcoded bundles of filters (docs/coding-patterns/list-views.md).
// Selecting one writes its filters to the URL; it is not state of its own, it
// shows as active while the URL matches it.

export interface ListPreset<F> {
  key: string
  label: string
  filters: Partial<F>
}

const normalize = (value: unknown): string =>
  Array.isArray(value) ? [...value].sort().join(',') : String(value ?? '')

/**
 * Preset helpers for one list. `noFilters` holds every filter at its empty
 * value; `filterKeys` lists the filter keys.
 */
export function createPresetHelpers<F extends object>(
  noFilters: F,
  filterKeys: readonly (keyof F)[]
) {
  return {
    /** The search params that clear every filter, e.g. when the active preset is unchecked. */
    clearFiltersPatch: noFilters as Partial<F>,

    /** The search params to apply for a preset: all filters reset, then the preset's set. */
    presetPatch: (preset: ListPreset<F>): Partial<F> => ({
      ...noFilters,
      ...preset.filters,
    }),

    /** The preset whose filters are active exactly, no more and no less. Search, sort and view do not count. */
    activePreset: <P extends ListPreset<F>>(
      search: Partial<F>,
      presets: P[]
    ): P | undefined =>
      presets.find((preset) => {
        const expected = { ...noFilters, ...preset.filters }
        return filterKeys.every(
          (key) => normalize(search[key]) === normalize(expected[key])
        )
      }),
  }
}
