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
[`frontend/src/routes/admin/_authenticated/adoptions/$adoptionId/route.tsx:18`](../../frontend/src/routes/admin/_authenticated/adoptions/$adoptionId/route.tsx)

**Route.Link** — link to a named route with required params:
[`frontend/src/admin/module/pre-inspections/components/PreInspectionList.tsx:115`](../../frontend/src/admin/module/pre-inspections/components/PreInspectionList.tsx)

**Imported Route.Link** — linking to a sibling/child route:
[`frontend/src/admin/module/organizations/components/OrganizationTabs.tsx:60`](../../frontend/src/admin/module/organizations/components/OrganizationTabs.tsx)
