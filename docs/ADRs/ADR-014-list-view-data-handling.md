# ADR-014: List View Data Handling

## Status

Proposed

## Context

The animal, person and adoption lists show data that grows without bound. They must be presentable as table and as cards, and support pagination, sorting, filters, filter presets (e.g. "my active adoptions") and full-text search.

Today all three index endpoints return the complete, unpaginated result via `->get()`:

- `Internal\AdoptionController::index` eager-loads about fifteen relations per row (animal, media, mediator, applicant, transport, signers, pre-inspections…) and only filters by `animal_id`, `mediator_id` and `applicant_id`.
- `Internal\AnimalController::index` and `Internal\PersonController::index` filter by a handful of ids and always sort by `created_at desc`.
- `Person::getRolesAttribute` issues three `count()` queries per person.
- `/adoptions/options` loads every animal and every person to fill dropdowns.

Doing sorting, filtering and search in the browser would require shipping the full, ever-growing data set, and would not work for several of the things users want to filter on:

- `contract_status`, `pre_inspection_status`, `transport_status` and `handover_status` of an adoption are PHP accessors derived from relations, not columns.
- Image URLs are signed per row at serialization time (see [media-urls.md](../coding-patterns/media-urls.md)), so every loaded row has a cost.
- Search spans relations (adoption → animal name, applicant name, mediator name).

Only the three lists above combine large data with many filters. Every other list in the application is small and bounded.

## Decision

**The three large lists are paginated, sorted, filtered and searched on the server, controlled entirely by query parameters. The frontend holds that state in the URL and only renders what the backend returns.**

- **One request contract** for all three lists: `page`, `per_page`, `sort` (a leading `-` means descending), `filter[<name>]` (comma-separated for multiple values) and `search`. Responses use Laravel's standard paginated resource collection (`data`, `meta`, `links`) via `->paginate()`. Offset pagination with a total is used rather than cursor pagination, because the UI shows page numbers and lets users sort by any column. Details are in [list-views.md](../coding-patterns/list-views.md).
- **No query-builder package.** Each list uses a `FormRequest` for validation (allowed sort keys, filter values, a capped `per_page`) and model scopes for everything that is not a plain column, in particular the derived adoption statuses. A shared trait is introduced only for logic that turns out to be identical across lists, not up front.
- **Derived values get a scope next to their accessor.** A filter on a derived status is a named model scope that expresses the same rule in SQL, and a test asserts that accessor and scope agree.
- **Search is `LIKE` over a short list of columns plus `whereHas` for related names.** If it becomes slow, a `FULLTEXT` index replaces it without changing the request contract.
- **State lives in the URL** (TanStack Router search params, validated with zod). Filters, sort and page are therefore bookmarkable and survive reloads. Routes own the data fetching as described in [decoupled-route-and-page.md](../coding-patterns/decoupled-route-and-page.md).
- **Table and cards are two renderings of one query.** Toolbar, pagination and sort control are shared; only the row renderer differs.
- **No TanStack Table.** With manual pagination, sorting and filtering, and state held by the URL and TanStack Query, it would contribute nothing but column typing. The list is built from the existing shadcn `Table` plus a few small shared components.
- **Presets are hardcoded per list** in the frontend as named bundles of search params. The backend has no concept of presets. User-saved presets are out of scope for now; nothing here prevents adding them later.
- **Lists that are not one of the three stay as they are**: unpaginated `->get()`, with a plain `where` filter where useful.
- **Pickers use searchable lookups, not options dumps.** Selecting a person or animal (e.g. a mediator, an applicant) calls the paginated list endpoint with `search`, a role/type filter and a small `per_page`, feeding the existing combobox. `/adoptions/options` is replaced accordingly. Small bounded sets (animal types, status values) can stay as plain lists.

## Consequences

### Positive

- Payload and query cost stay bounded regardless of data growth.
- Derived-status filters and cross-relation search work, because they run in SQL.
- No new runtime dependency on either side.
- URL state makes views shareable and makes preset implementation trivial.
- Table and card views, and pickers, share one request contract.

### Negative

- Every sortable or filterable field needs explicit backend support (whitelist plus scope), where client-side filtering would have come for free.
- Scopes duplicate accessor logic in SQL and need tests to stay in sync.
- Sorting by a relation column (e.g. applicant last name) needs a join, which has to be handled carefully together with eager loading.
- `LIKE '%term%'` cannot use a regular index. This is acceptable at the expected scale but is a known ceiling.
- The list endpoints' response shape changes (wrapped in `meta`/`links`), so all existing consumers of them need to be adjusted in the same change.

## Alternatives Considered

- **Load everything, work client-side (e.g. TanStack Table).** Rejected: unbounded payloads, no way to filter on derived statuses or search across relations without loading the whole graph.
- **`spatie/laravel-query-builder`.** Rejected for now: only three lists need this, and the package's value is in amortising the plumbing across many endpoints. FormRequests and scopes are plain Laravel and keep the logic where the domain rules are. Can be reconsidered if the number of such lists grows.
- **A bespoke `ListQuery` builder class.** Rejected as premature: with three lists the duplicated part is small, and a shared trait can be extracted once the actual duplication is visible.
- **Cursor pagination.** Rejected: incompatible with page numbers and arbitrary sorting.
- **Scout / Meilisearch.** Rejected: additional infrastructure for a search need that `LIKE` (and later `FULLTEXT`) covers at this scale.
- **User-saved presets from the start.** Deferred: needs storage, UI and permissions for a feature the hardcoded presets already cover.
