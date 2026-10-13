# List Views

## Overview

Lists with large, growing data (adoptions, animals, people) are paginated, sorted, filtered and searched **on the server**. The frontend keeps that state in the URL, sends it as query parameters, and renders the result as table or cards.

Rationale and rejected alternatives: [ADR-014](../ADRs/ADR-014-list-view-data-handling.md).

Small, bounded lists (organizations, API tokens, users, form templates…) do **not** use this pattern. They stay unpaginated.

## Request contract

| Param | Example | Meaning |
|---|---|---|
| `page` | `2` | 1-based page number |
| `per_page` | `25` | Page size, capped by the FormRequest (default 25, max 100) |
| `sort` | `-created_at` | One sort key; leading `-` means descending |
| `filter[<name>]` | `filter[status]=pending,in_progress` | Comma-separated values are OR-ed within one filter; different filters are AND-ed |
| `search` | `search=müller` | Free text over the list's search columns |

Unknown sort keys or filter names are a validation error (422), never silently ignored.

Response is Laravel's paginated resource collection:

```json
{ "data": [ … ], "meta": { "current_page": 1, "last_page": 8, "per_page": 25, "total": 187 }, "links": { … } }
```

## Backend

One list = one `FormRequest` + model scopes + a short controller method.

```php
public function index(AdoptionIndexRequest $request): AnonymousResourceCollection
{
    $adoptions = Adoption::query()
        ->with(self::LIST_RELATIONS)
        ->filter($request->filters())   // scopes, see below
        ->search($request->search())
        ->sorted($request->sort())
        ->paginate($request->perPage());

    return AdoptionListResource::collection($adoptions);
}
```

### FormRequest owns the whitelist

The request declares the allowed sort keys, filter names and filter values, and caps `per_page`. This is the only place where "what may a client ask for" is defined.

### Scopes own the SQL

- Plain column filters are `whereIn` / `where`.
- **A filter on a derived value is a named scope** that expresses the accessor's rule in SQL (e.g. `Adoption::scopeContractStatus()` next to `getContractStatusAttribute()`). Add a test that asserts accessor and scope agree for every state.
- **Sorting by a relation column** needs a join (or subquery). Select `table.*` explicitly so eager loading and resources keep working.
- **Search** is `LIKE` over the list's columns plus `orWhereHas` for related names. Group the `orWhere` clauses so they don't escape other constraints. Escape `%` and `_` in the term.
- Always add a deterministic tie-breaker (`id`) to the sort so pages don't overlap.

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
- Query key includes the full params object, and the query uses `placeholderData: keepPreviousData` so the list doesn't flash while paging.
- Search input is debounced (~300 ms) before it hits the URL.

### Shared building blocks

Table and card views are two renderers over the same result:

- `ListToolbar` — search, filter controls, presets, view toggle
- `SortableHead` — table header cell that toggles sort; cards use a "Sort by" select with the same sort keys
- `ListPagination` — built on shadcn pagination, driven by `meta`
- `useListSearchParams` — reads/updates the URL state (page reset, defaults)

No table library is used; row rendering is the existing shadcn `Table` / card components.

### Presets

Presets are **hardcoded per list** as named bundles of search params, defined next to the list's module:

```ts
export const adoptionPresets = [
  { label: 'Meine aktiven Vermittlungen', params: { filter: { status: ['pending', 'in_progress'], mediator_id: 'me' } } },
]
```

A preset is not a separate state: selecting one just writes its params to the URL; the preset appears active when the URL matches it.

### Pickers

For selecting a person or animal in a form, call the same list endpoint with `search`, the relevant filter (e.g. `filter[role]=mediator`) and a small `per_page`, and feed the combobox. Do not add `options` endpoints that return a whole table.

## Public API

The public API is separate (`api/routes/api.php`). If a public endpoint adopts this contract, update `api/public/openapi.yaml`.
