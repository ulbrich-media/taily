# API Type Handling

This pattern governs how data transferred between the backend and frontend is typed.
It ensures type safety, clarity about what each endpoint returns, and a single source of truth for API shapes.

## Rules

### Backend: All responses go through Resources

Every model returned from an endpoint must be wrapped in a Laravel Resource — never a raw Eloquent model.
Resources define the exact shape of the data sent over the wire, making the contract explicit.

Use the established `Base → List → Detail` hierarchy:
- **BaseResource**: all scalar fields and conditional relations (via `whenLoaded`)
- **ListResource**: extends Base, adds list-specific fields (e.g. `profile_picture_url`)
- **DetailResource**: extends Base, adds detail-specific fields (e.g. full `pictures` array)

### Backend: Nested relations use proper Resources

When a relation is included in a Resource, it must itself be wrapped in a Resource — not returned as a raw model.

**Correct:**
```php
'assigned_agent' => $this->whenLoaded('assignedAgent', fn ($v) => $v ? new PersonBaseResource($v) : null),
'adoptions'      => AdoptionBaseResource::collection($this->whenLoaded('adoptions')),
```

**Wrong:**
```php
'assigned_agent' => $this->whenLoaded('assignedAgent'),  // raw model
```

### Frontend: Types live in `frontend/src/api/types/*.ts`

All types for data received from the API (resource shapes) belong in `frontend/src/api/types/`.
One file per domain entity:

```
frontend/src/api/types/
  animal-types.ts       ← AnimalTypeResource
  people.ts             ← PersonBaseResource, PersonListResource, PersonDetailResource
  health-conditions.ts  ← HealthConditionVaccinationResource, HealthConditionTestResource
  adoptions.ts          ← AdoptionBaseResource, ...
  animals.ts            ← AnimalListResource, AnimalDetailResource, AnimalPicture
  ...
```

Request types (sent to the API) and query filter interfaces stay in the module's own `api/` folder.

### Frontend: Types mirror the Resource, not the model

The TypeScript interface for a resource must exactly match what that resource outputs.
Name the interface after the resource class: `AnimalListResource`, `PersonBaseResource`, etc.

Define **one type per resource**: since list and detail resources differ (different relations loaded),
use `AnimalListResource` and `AnimalDetailResource` — not a single overloaded `Animal` type.

### Frontend: Optional fields are `| null`, never `| undefined`

An optional field in a resource is one that can hold a null value (e.g. a nullable FK).
It must be typed as `Type | null` — never as `Type | undefined` or `Type?`.

The `?` syntax (`field?: Type`) means the key may be absent entirely. Avoid it for resource
fields: if a resource always emits the key (even when the value is null), the type must reflect that.

**Correct:**
```typescript
assigned_agent: PersonBaseResource | null  // nullable FK, key always present
date_of_birth: string | null               // optional date, key always present
```

**Wrong:**
```typescript
assigned_agent?: PersonBaseResource        // implies key may be absent
date_of_birth?: string                     // hides that null is the correct empty value
```

The only time `?` (optional key) is justified is when the key is genuinely absent from some
responses — e.g. a field only in `DetailResource` but not `ListResource`. In practice this is
avoided by defining separate list and detail types.

## Implementing a new resource type

1. **Backend**: create `XBaseResource`, `XListResource`, `XDetailResource` as needed.
   Wrap every nested relation using its own resource class.

2. **Frontend**: add `frontend/src/api/types/x.ts` with interfaces matching each resource.
   Import nested resource types from their own files.

3. **Frontend module**: the module's `api/requests.ts` imports from `@/api/types/x.ts`.
   Keep request/input types (e.g. `CreateXRequest`) in the module's own `api/types.ts`.

## Examples

**Backend — properly nested resource:**
[`api/app/Http/Resources/AnimalBaseResource.php`](../../api/app/Http/Resources/AnimalBaseResource.php)

**Frontend — central resource types:**
[`frontend/src/api/types/animals.ts`](../../frontend/src/api/types/animals.ts)

**Frontend — module request types (not resources):**
[`frontend/src/admin/module/animals/api/types.ts`](../../frontend/src/admin/module/animals/api/types.ts)
