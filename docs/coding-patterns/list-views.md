# List Views

## Overview

Lists with large, growing data (adoptions, animals, people) are paginated, sorted, filtered and searched **on the server**. The frontend keeps that state in the URL, sends it as query parameters, and renders the result as table or cards.

Rationale and rejected alternatives: [ADR-014](../ADRs/ADR-014-list-view-data-handling.md).

Small, bounded lists (organizations, API tokens, users, form templates…) do **not** use this pattern. They stay unpaginated.

## Request contract

| Param | Example | Meaning |
|---|---|---|
| `page` | `2` | 1-based page number |
| `per_page` | `25` | Page size, capped by the FormRequest (default 25, max 100). `0` only counts, see below |
| `sort` | `-created_at` | One sort key; leading `-` means descending |
| `filter[<name>]` | `filter[status]=pending,in_progress` | Comma-separated values are OR-ed within one filter; different filters are AND-ed |
| `search` | `search=müller` | Free text over the list's search columns |

Unknown sort keys or filter names are a validation error (422), never silently ignored.

Response is Laravel's paginated resource collection:

```json
{ "data": [ … ], "meta": { "current_page": 1, "last_page": 8, "per_page": 25, "total": 187 }, "links": { … } }
```

### Counting without loading rows

`per_page=0` on the same endpoint answers with the total of the filtered query and no rows. Filters and search apply, nothing is eager-loaded or sorted, and a single `count` query runs. Use it for badges and preset counters.

```json
{ "data": [], "meta": { "current_page": 1, "last_page": 1, "per_page": 0, "total": 42 } }
```

## Backend

One list = one `FormRequest` + model scopes + a short controller method.

```php
public function index(AdoptionIndexRequest $request): AnonymousResourceCollection|JsonResponse
{
    $query = Adoption::query()
        ->filterBy($request->filters())   // scopes, see below
        ->search($request->searchTerm());

    if ($request->perPage() === 0) {
        return response()->json(['data' => [], 'meta' => [/* …, */ 'total' => $query->count()]]);
    }

    return AdoptionListResource::collection(
        $query->with(self::LIST_RELATIONS)
            ->sortedBy($request->sortKey(), $request->sortDirection())
            ->paginate($request->perPage())
    );
}
```

See `AdoptionController::index`, `AdoptionIndexRequest` and the scopes on `Adoption` for the reference implementation.

### FormRequest owns the whitelist

The request declares the allowed sort keys, filter names and filter values, and caps `per_page`. This is the only place where "what may a client ask for" is defined.

### Scopes own the SQL

- Plain column filters are `whereIn` / `where`.
- **A filter on a derived value is a named scope** that expresses the accessor's rule in SQL (e.g. `Adoption::scopeContractStatus()` next to `getContractStatusAttribute()`). Add a test that asserts accessor and scope agree for every state.
- **Sorting by a relation column** needs a join (or subquery). Select `table.*` explicitly so eager loading and resources keep working.
- **Search** is `LIKE` over the list's columns plus `orWhereHas` for related names. Group the `orWhere` clauses so they don't escape other constraints. Escape `%` and `_` in the term.
- Sort by a related name with a correlated subquery in `orderBy`, not a join: the query keeps selecting only the list's own columns and counts stay exact.
- Always add a deterministic tie-breaker (`id`) to the sort so pages don't overlap.
- **Derived step statuses are one filter per step** (`filter[contract_status]=pending,finished`). Values of one step are OR-ed, different steps are AND-ed, which matches the general rule above.

### Keep list rows slim

A list resource carries what the row/card renders, not the detail graph. Prefer `withCount` / computed status values over eager-loading whole relations only to derive a status. Avoid per-row queries in accessors (e.g. `Person::getRolesAttribute`) on the list path.

### `me`

A filter value of `me` is resolved server-side to the current user's person. Only available once `User` ↔ `Person` is modelled (see ADR-014, prerequisite).

### Duplication

Don't build a generic query builder up front. If sort-direction parsing or the `per_page` cap ends up identical in all lists, extract a trait then.

## Frontend

### State in the URL

The route declares the search params with `validateSearch` (zod), including defaults. Changing a filter, sort or search term resets `page` to 1.

- The route reads params, passes them into the query and the page component as props; the page reports changes via callback props (see [decoupled-route-and-page.md](decoupled-route-and-page.md)).
- Query key includes the full params object, and the query uses `placeholderData: keepPreviousData` so the list doesn't flash while paging. The route uses `stripSearchParams(defaults)` so default values stay out of the URL.
- Search is applied explicitly (search button or Enter), so typing never changes the URL or triggers a request. The one exception is emptying the field, which clears the search right away.

### Shared building blocks

Table and card views are two renderers over the same result. The generic parts live in `frontend/src/components/list/`, the list-specific ones next to the list's module (reference: adoptions).

- `ListToolbar` — filter bar: `search`, `filters` (declarative `ToolbarFilter[]`: `multi`, `single`, `sections`) and `trailing` controls (sort, view switch). Mobile: search on its own row, filters below. From `md`: search left, filters right on one row. Filters that don't fit collapse, last first, into one "Filter" button with a submenu per filter, measured with a `ResizeObserver`; never a second line, never horizontal scrolling. An icon-only reset button (`onReset`/`canReset`) sits after the last filter or the "Filter" button (right-aligned with them from `md`), disabled while nothing is active
- `FilterDropdown` — a single filter as dropdown: checkbox items for multi-value filters, a radio group (with an "Alle …" entry) for single-value filters; both show the stock shadcn check; also used for the sort order in `trailing`. Triggers are ghost `sm` buttons showing only the filter name; an active filter shows a primary-coloured dot (`components/icons/circle.tsx`) instead of the chevron
- `SearchInput` — input group with an explicit search button; the term is applied on submit (button or Enter), not while typing
- `SortableHead` — table header cell that toggles sort; the "Sortierung" dropdown in the toolbar offers the same sort keys in both views, and is the only way with cards
- `ListPagination` — built on the shadcn `Pagination`, driven by `meta`
- `ListViewToggle`, `useScrollListIntoView` — the table/cards switch (from `lg` up) and the scroll-on-page-change behaviour
- `list-search.ts` — `applyListChange` (every change except `page` resets the page), sort helpers, `listViewVisibility`
- `<list>.search.ts` in the module — zod schema with defaults, `buildQuery` for the request contract, `hasActiveFilters`

No table library is used; row rendering is the existing shadcn `Table` / card components.

### View: table or cards

The view is URL state like everything else (`view=table|cards`, default `table`). Both renderers are in the DOM and CSS picks one: cards are always shown below `lg`, so small screens need no JS media query; the view toggle is only offered from `lg`. The view is presentation only and is excluded from the loader deps and the query key. Changing it keeps the page.

Sorting is available in both views: column headers toggle it in the table, and the toolbar's "Sortierung" dropdown offers every sort key (the only way with cards).

### Loading feedback and scrolling

- **The loader must not block in-page changes.** When filters, sort or page change on the open list (`cause === 'stay'`) the route loader only starts the fetch (`prefetchQuery`, not awaited). Otherwise TanStack Router keeps the old URL and render until the data is in, and the page never gets to show an updating state. Entering the list still awaits its data.
- **Updating state, no spinners and no layout shift:** with `placeholderData: keepPreviousData` the old result stays in place while `isPlaceholderData` is true. The page passes it down as `isUpdating`; the table or cards pulse (`updatingClass`, header included, after a 150 ms delay so fast responses never flash) and cannot be clicked. The pagination is left alone.
- **`TableCard`** (`components/card/TableCard.tsx`) is the card for a table: edge-to-edge, clipped to the card's rounded corners so row and header hover follow the radius, with a progress line along its top edge while `loading`. The line is `ProgressBar` (`components/list/ProgressBar.tsx`), our own because shadcn's `Progress` is determinate and has no value to show here: it appears after 150 ms and a started sweep always runs to the end. The cards view has no common edge, so its line runs in the gap between toolbar and grid.
- **History:** every change on the list replaces the history entry (`replace: true`), page changes included, so the back button leaves the list instead of stepping through filters and pages. That is a decision, not an accident.
- **Pages past the end** (old link, rows gone meanwhile) are redirected to the last page that exists.
- **Scrolling:** the route navigates with `resetScroll: false`, so filtering never moves the page. A page change scrolls the top of the list (toolbar included) into view right away, but only when it is out of view; `prefers-reduced-motion` is respected.
- **Failures** are left to the router's error handling (`throwOnError`) until there is a unified approach.

### Remembering the last filters

The URL stays the source of truth, but coming back to the list through the navigation (a link without params) shows the filters of the last visit again. `components/list/remembered-list-search.ts` keeps a copy of the list's search in `localStorage` (per list key, without `page`) together with its save time.

- Read only when the list is **entered** with a URL that asks for nothing special (all defaults). Any explicit param, e.g. a shared link, wins and nothing is restored.
- Only recent state counts: entries older than `REMEMBER_MAX_AGE_MS` (2 h) are ignored and dropped. This is for work in progress, not a saved view.
- The stored value is parsed with the route's zod schema again, so values that became invalid (deleted mediator, removed option) are discarded.
- A reset is remembered too, otherwise clearing the filters would bring the old ones back.
- Cleared on login and logout; storage failures are ignored.
- A route opts in with a `beforeLoad` redirect and a `rememberListSearch` effect, see the adoptions list route.

### Presets

Presets are **hardcoded per list** as named bundles of filters, defined next to the list's module (reference: `adoption-list.presets.ts`):

```ts
export const adoptionPresets = [
  { key: 'unassigned', label: 'Neu und ohne Vermittler', filters: { status: ['pending'], mediator_id: 'none' } },
]
```

A preset is not a separate state: selecting one writes its filters to the URL, resetting every other filter first. The preset shows as checked while exactly its filters are active (search, sort, view and page don't count). In the toolbar it is a `multi` filter of independent checkbox items, first in the list, so it collapses last. At most one preset matches at a time, so it behaves like a radio group; unchecking the active one clears all filters.

### Pickers

For selecting a person or animal in a form, call the same list endpoint with `search`, the relevant filter (e.g. `filter[role]=mediator`) and a small `per_page`, and feed the combobox. Do not add `options` endpoints that return a whole table.

## Public API

The public API is separate (`api/routes/api.php`). If a public endpoint adopts this contract, update `api/public/openapi.yaml`.
