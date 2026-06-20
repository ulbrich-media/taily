# Dynamic hooks and components for Routes

Avoid generic `<Link to="/example" />` or `useNavigate({ to: '/example' })`. Use route-specific variants instead. This ensures type-safe params and keeps navigation coupled to the route definition.

## Rule

| Avoid                                   | Prefer                                       |
|-----------------------------------------|----------------------------------------------|
| `<Link to="/adoptions/$id">`            | `<AdoptionDetailRoute.Link params={{ id }}>` |
| `useNavigate({ to: '/adoptions/$id' })` | `AdoptionDetailRoute.useNavigate()`          |
| `useParams()`                           | `Route.useParams()`                          |

## Examples

**Route.useParams()** — typed params without string casts:
[`frontend/src/routes/admin/_authenticated/adoptions/$adoptionId/route.tsx`](../../frontend/src/routes/admin/_authenticated/adoptions/$adoptionId/route.tsx)

**Route.Link** — link to a named route with required params:
[`frontend/src/routes/admin/_authenticated/adoptions/$adoptionId/route.tsx`](../../frontend/src/routes/admin/_authenticated/adoptions/$adoptionId/route.tsx)

**Imported Route.Link** — linking to a sibling/child route:
[`frontend/src/routes/admin/_authenticated/adoptions/$adoptionId/route.tsx`](../../frontend/src/routes/admin/_authenticated/adoptions/$adoptionId/route.tsx)
