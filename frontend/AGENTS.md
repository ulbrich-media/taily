# Frontend Development Guide for AI Agents

This document contains best practices, patterns, and commands for working with this React/TypeScript frontend application.

## Table of Contents

- [Available Commands](#available-commands)
- [Project Structure](#project-structure)
- [Route Navigation](#route-navigation)
- [Form Components](#form-components)
- [List Views](#list-views)
- [Navigation Cards](#navigation-cards)
- [Data Fetching](#data-fetching)
- [Styling & UI](#styling--ui)
- [Common Patterns](#common-patterns)

---

## Available Commands

```bash
npm run build        # Build the application
npm run lint         # Run linter checks
npm run lint:fix     # Run linter with auto fix
npm run format       # Run prettier checks
npm run format:fix   # Run prettier with auto fix
npm run flightcheck  # Run all checks
```

---

## Project Structure

```
frontend/
├── src/
│   ├── admin/
│   │   ├── module/           # Feature modules
│   │   │   ├── animals/
│   │   │   ├── people/
│   │   │   ├── users/
│   │   │   └── */
│   │   │       ├── pages/        # Page components
│   │   │       ├── components/   # Module-specific components
│   │   │       └── api/          # API layer
│   │   │           ├── requests.ts   # API request functions
│   │   │           ├── queries.ts    # React Query definitions
│   │   │           └── types.ts      # TypeScript types
│   │   ├── pages/            # Root-level pages (Settings, etc.)
│   │   └── components/       # Shared admin components
│   ├── components/           # Global shared components
│   │   ├── field/           # Reusable form field components
│   │   ├── form/            # Form layout components
│   │   ├── layout/          # Layout components (PageHeader, etc.)
│   │   ├── list/            # List view components
│   │   └── navigation/      # Navigation components
│   ├── routes/              # TanStack Router route definitions
│   │   └── admin/_authenticated/
│   └── shadcn/components/   # shadcn/ui components
```

---

## Route Navigation

### ✅ Best Practice: Route-Specific Imports

Always import routes specifically and use their type-safe methods:

```typescript
// ✅ CORRECT
import { Route } from '@/routes/admin/_authenticated/animals/_animalsList/index'
import { Route as CreateRoute } from '@/routes/admin/_authenticated/animals/create'

const navigate = Route.useNavigate()
const search = Route.useSearch()

<CreateRoute.Link params={{ id: '123' }}>
  Navigate
</CreateRoute.Link>
```

```typescript
// ❌ WRONG - Don't use generic hooks with hardcoded paths
import { useNavigate, Link } from '@tanstack/react-router'

const navigate = useNavigate()
<Link to="/admin/animals/create">Navigate</Link>
```

### Benefits

- **Type-safe**: TypeScript validates route parameters and search params
- **Refactor-friendly**: Route changes are caught at compile time
- **Better IDE support**: Autocomplete for route methods
- **No magic strings**: Routes defined once in route files

### Example Pattern

```typescript
export function MyListPage() {
  const navigate = Route.useNavigate()
  const search = Route.useSearch()

  const handleFilter = (value: string) => {
    navigate({
      search: { filter: value },
      replace: true,
    })
  }

  return (
    <CreateRoute.Link search={{ preset: search.filter }}>
      Create New
    </CreateRoute.Link>
  )
}
```

---

## Form Components

### Reusable Field Components

Located in `@/components/field/`, these components wrap react-hook-form functionality.

### ✅ Usage Pattern

```typescript
import { TextInput } from '@/components/field/TextInput'
import { SelectInput } from '@/components/field/SelectInput'

<FieldGroup>
  <TextInput
    name="name"
    control={form.control}
    label="Name"
    required
  />

  <SelectInput
    name="role"
    control={form.control}
    label="Rolle"
    required
    options={[
      { value: 'user', label: 'Benutzer' },
      { value: 'admin', label: 'Administrator' },
    ]}
    placeholder="Rolle auswählen"
    disabled={isEditMode}
  />
</FieldGroup>
```

### Form Layout Components

For larger forms, use layout components:

```typescript
import { FormSection } from '@/components/form/FormSection'
import { FormGrid } from '@/components/form/FormGrid'

<FormSection
  title="Allgemeine Angaben"
  description="Die wichtigsten Informationen."
>
  <FormGrid>
    <TextInput name="name" control={form.control} label="Name" />
    <TextInput name="email" control={form.control} label="E-Mail" />
  </FormGrid>
</FormSection>
```

**Note:** Dialog forms (small forms) should NOT use `FormGrid` - use plain `FieldGroup` instead.

---

## Common components

- TableListView component in `@/components/list/TableListView`: Wrapper for consistent list views.
- PageHeader component in `@components/layout/PageHeader`: Consistent page header with optional action.
- NavigationCards component in `@/components/navigation/NavigationCards`: Card with optional actions for linking in overview pages.

---

## Data Fetching

### TanStack Query (React Query)

#### Define Queries

In `api/queries.ts`:

```typescript
import { queryOptions } from '@tanstack/react-query'

export const myQueryKeys = {
  all: ['myResource'] as const,
  list: (filters?: Filters) => ['myResource', 'list', filters] as const,
  detail: (id: string) => ['myResource', 'detail', id] as const,
}

export const listMyResourceQuery = (filters?: Filters) =>
  queryOptions({
    queryFn: () => getMyResource(filters),
    queryKey: myQueryKeys.list(filters),
  })
```

#### Use in Components

```typescript
import { useSuspenseQuery } from '@tanstack/react-query'

const { data } = useSuspenseQuery(listMyResourceQuery())
```

Add query to the routes loader as well.

#### Invalidate After Mutations

```typescript
const queryClient = useQueryClient()

const mutation = useMutation({
  mutationFn: createResource,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: myQueryKeys.list() })
  },
})
```

---

## Styling & UI

### Component Library

- Uses **shadcn/ui** components
- Located in `@/shadcn/components/ui/`
- Pre-configured with Tailwind CSS

### Styling Guidelines

- Use Tailwind utility classes
- Always prefer existing shadcn ui components
- Add missing components from shadcn ui if needed
- Don't manipulate them directly, for now they are used as they come
- Use semantic color classes (`text-primary`, `text-destructive`)

---

## Common Patterns

### Toast Notifications

Use toast for user feedback:

```typescript
import { toast } from 'sonner'

toast.success('Erfolgreich gespeichert')
toast.error('Fehler beim Speichern')
```

---

## Type Safety

### Always Use Types

- Use `z.infer<typeof schema>` for form types
- Avoid `any` - use `unknown` if type is truly unknown

### Route Type Safety

Route-specific imports provide:

- Type-safe parameters
- Type-safe search params
- Type-safe loader data

```typescript
const { id } = Route.useParams() // Typed!
const search = Route.useSearch() // Typed!
const { data } = Route.useLoaderData() // Typed!
```

---

## Don'ts

- Never disable linting rules, always fix the issues

---
