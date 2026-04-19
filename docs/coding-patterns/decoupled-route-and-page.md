# Decoupled Routes and Page Components

## Overview

Route files and Page components have distinct responsibilities. Keeping them separate makes pages easier to test, reason about, and potentially reuse — and prevents route-specific concerns from leaking into UI logic.

## The Pattern

**Route files** (`src/routes/...`) are responsible for:
- Prefetching data in the `loader` (via `queryClient.ensureQueryData`)
- Reading route params via `Route.useParams()`
- Resolving suspense queries and passing the results as props
- Owning navigation decisions (where to go after an action)

**Page components** (`src/admin/module/.../pages/...`) are responsible for:
- Rendering UI and handling user interactions
- Running mutations and managing local form state
- Signalling outcomes to the route via callback props (`onSuccess`, `onCancel`, etc.)
- Never importing or referencing route-specific hooks or `Route.*` APIs

## Data Flow

```
Route loader
  └── prefetches queries into cache

Route component (RouteComponent)
  ├── reads params via Route.useParams()
  ├── resolves data via useSuspenseQuery() (hits cache, never suspends)
  ├── owns navigation callbacks
  └── renders <PageComponent data={...} onSuccess={...} />

Page component
  ├── receives data and callbacks as props
  ├── runs mutations, manages form state
  └── calls onSuccess / onCancel when appropriate
```

## Navigation: Prefer Callback Props

Page components should not import `useNavigate`, `Route.Link`, or any route-specific API. Navigation destinations are routing knowledge — they belong in the route file.

Instead, the route component passes **callback props** that signal outcomes. The page calls them; the route decides where to go.

```tsx
// ✅ Route component — owns where to navigate
function RouteComponent() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  return (
    <SomeDeletePage
      onDeleted={() => navigate({ to: '/admin/people' })}
      onCancelled={() => navigate({ to: '/admin/people/$id', params: { id } })}
    />
  )
}

// ✅ Page component — signals outcomes, no routing imports
interface SomeDeletePageProps {
  data: SomeRecord
  onDeleted: () => void
  onCancelled: () => void
}

export function SomeDeletePage({ data, onDeleted, onCancelled }: SomeDeletePageProps) {
  const mutation = useMutation({
    mutationFn: () => deleteRecord(data.id),
    onSuccess: onDeleted,
  })
  // ...
}
```

## Example Implementation

- Route file: `src/routes/admin/_authenticated/animals/_animalDetail/.../placement.tsx`
- Page component: `src/admin/module/animals/pages/AnimalEditPlacementPage.tsx`

## Benefits

**Testability** — Page components only need props. No router mocking required to unit-test them.

**Clear responsibilities** — Route files are the entry point for routing concerns. Anyone reading a page component doesn't need to understand the route structure to follow the logic.

**Reusability** — A page component can be mounted in a different route context (e.g., inside a modal vs. a full page) without changes.

**Suspense is handled once** — The route loader warms the cache; the `useSuspenseQuery` calls in the route component resolve instantly. The page never triggers a suspense boundary.

## What Belongs Where

| Concern                  | Route file            | Page component |
|--------------------------|-----------------------|----------------|
| Prefetching data         | ✅ `loader`            | ❌              |
| Reading route params     | ✅ `Route.useParams()` | ❌              |
| Resolving queries        | ✅ `useSuspenseQuery`  | ❌              |
| Navigation after actions | ✅ callback props      | ✅ calls them   |
| Mutations                | ❌                     | ✅              |
| Form state               | ❌                     | ✅              |
| UI / rendering           | ❌                     | ✅              |
