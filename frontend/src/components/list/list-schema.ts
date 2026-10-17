// Building blocks for the zod schema of a list's URL state
// (see docs/coding-patterns/list-views.md).
import { z } from 'zod'

// Invalid or hand-edited values fall back to the default instead of failing
// the whole route.

/** A multi-value filter: a list of enum values, `[]` when unset or invalid. */
export const multi = <const T extends readonly [string, ...string[]]>(
  values: T
) => z.array(z.enum(values)).default([]).catch([])

/** Yes/no filters: `1` or `0`, unset means "all". */
export const yesNo = z.enum(['0', '1']).optional().catch(undefined)

/** "Only" flags: `1` or unset. */
export const only = z.literal('1').optional().catch(undefined)

/** Every sort key in both directions: `name` and `-name`. */
export function sortsFor<const K extends string>(
  keys: readonly K[]
): (K | `-${K}`)[] {
  return keys.flatMap((key) => [key, `-${key}` as const])
}

/** Type guard for the sort values a list accepts. */
export function sortGuard<S extends string>(sorts: readonly S[]) {
  return (value: string): value is S =>
    (sorts as readonly string[]).includes(value)
}

/**
 * The fields of a list with a fixed order that is not user-selectable: like
 * `baseListSearchShape`, but `sort` is always empty (and not sent), and
 * `search` is too unless the list is `searchable`.
 */
export function fixedOrderListSearchShape({
  searchable = false,
}: { searchable?: boolean } = {}) {
  const base = baseListSearchShape({ sorts: ['name'], defaultSort: 'name' })
  return {
    page: base.page,
    sort: z.literal('').default('').catch(''),
    search: searchable ? base.search : z.literal('').default('').catch(''),
  }
}

/**
 * The fields every list has: page, sort and search. The table/cards view is
 * not among them: it is not URL state, see `useListView`. A list's schema
 * spreads this into its own `z.object({ ...baseListSearchShape(…), filters })`.
 */
export function baseListSearchShape<const S extends string>({
  sorts,
  defaultSort,
}: {
  sorts: readonly S[]
  defaultSort: NoInfer<S>
}) {
  return {
    page: z.number().int().min(1).default(1).catch(1),
    sort: z
      .enum(sorts as unknown as readonly [S, ...S[]])
      .default(defaultSort)
      .catch(defaultSort),
    // Same limit as the endpoints, which reject more.
    search: z.string().trim().max(100).default('').catch(''),
  }
}
