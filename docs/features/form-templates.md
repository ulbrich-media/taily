# Form Templates

Form templates are reusable, versioned schemas that define the structure of dynamic forms used throughout Taily — for example a veterinary inspection report or an adoption application. They decouple the _shape_ of a form from any specific feature, so the same builder infrastructure can power any form-based workflow.

---

## Concepts

### Two-table structure

Form templates are split across two tables:

- **`form_templates`** — the stable parent entity. Holds only the template name and a UUID that never changes across version bumps. Foreign keys from other models (e.g. `animal_types.pre_inspection_form_template_id`) always point here.
- **`form_template_versions`** — the versioned schemas. Each row holds a `schema`, `ui_schema`, a `version` integer, and a FK back to the parent `form_templates` row.

This separation means a feature's FK to a template never goes stale when a breaking schema change creates a new version — the FK always resolves to the same parent, which in turn always surfaces the latest version.

### Version

Whenever a template is edited in a way that would break already-submitted data, a **new version** is created automatically rather than overwriting the existing one. The old version is preserved so historical submissions remain valid against the schema they were filled against. See [Versioning](#versioning) below for the exact rules.

### Schema format

Each template version stores two complementary documents:

| Field | Purpose | Standard |
|---|---|---|
| `schema` | Validation — field types, required fields, value constraints | JSON Schema Draft-07 |
| `ui_schema` | Presentation — labels, widgets, placeholders, field order | RJSF-style (React JSON Schema Form conventions) |

The two documents are always stored and transmitted together but kept strictly separated: `schema` says _what is valid_, `ui_schema` says _how to display it_.

Example pair for a single text field named `motivation`:

```json
// schema
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "motivation": { "type": "string", "maxLength": 1000 }
  },
  "required": ["motivation"],
  "additionalProperties": false
}

// ui_schema
{
  "ui:order": ["motivation"],
  "motivation": {
    "ui:title": "Motivation zur Adoption",
    "ui:widget": "textarea",
    "ui:placeholder": "Bitte beschreiben Sie Ihre Motivation…"
  }
}
```

---

## Field types

The builder supports ten field types. Each type knows how to serialize itself into the schema/uiSchema pair and how to deserialize back.

| Type | JSON Schema representation | uiSchema marker |
|---|---|---|
| `text` | `type: string` | — |
| `textarea` | `type: string` | `ui:widget: textarea` |
| `number` | `type: number` | — |
| `integer` | `type: integer` | — |
| `checkbox` | `type: boolean` | — |
| `select` | `type: string` + `enum: [...]` | — |
| `radio` | `type: string` + `enum: [...]` | `ui:widget: radio` |
| `date` | `type: string`, `format: date` | `ui:widget: date` |
| `email` | `type: string`, `format: email` | `ui:widget: email` |
| `phone` | `type: string`, `format: phone` | `ui:widget: phone` |
| `heading` | — (not in `properties`) | `ui:widget: heading` |

`number` and `integer` share the same UI but differ in validation: `integer` enforces whole numbers (rejects `30.5`). The builder exposes this as an "Nur ganze Zahlen" checkbox in the number field settings, which emits `type: integer` instead of `type: number`.

**Supported numeric constraints:** `minimum`, `maximum`, `multipleOf` (step — e.g. `0.5` for half-star ratings).  
**Supported string constraints:** `minLength`, `maxLength`.  
**Format-specific validation:** `format: email` validates the address format; `format: date` and `format: phone` are type hints for widget selection only — no additional format validation is applied.

**Heading** is a layout-only element — it carries no validation meaning and produces no key in `schema.properties` or in submitted data. Headings appear only in `ui_schema` (in `ui:order` and as a `ui:widget: heading` entry). Renderers discover headings by scanning `ui:order` for keys that have `ui:widget: heading` but no corresponding entry in `properties`.

---

## Versioning

The backend automatically decides whether a change to a form is an **in-place update** or a **new version**. The decision is made by `SchemaChangeAnalyzer` by comparing the old and new schemas, combined with a submission check.

### Breaking changes → new version (if submissions exist)

A new version is created when the schema change is breaking **and** the current version already has at least one submission. If no submissions exist, even breaking changes are applied in place since no historical data would be invalidated.

A schema change is considered breaking when:
- An existing property is **removed**
- A property's **type** or **format** changes
- A field is added to **`required`** (already-submitted data may lack that field)
- An **enum value is removed** (existing submissions may contain that value)
- A numeric or string **constraint is tightened** (higher `minimum`, lower `maximum`, added `minLength`/`maxLength`)
- `additionalProperties: false` is **added** (previously accepted extra keys are now rejected)

### Non-breaking changes → always in-place update

A save always updates the existing record when:
- Only **labels, titles, or descriptions** change
- A new **optional** field is added (not in `required`)
- An **enum value is added** (more permissive)
- A constraint is **loosened** (lower minimum, higher maximum, removed limit)
- `additionalProperties: false` is **removed**

---

## Form submissions

### Overview

Any model can persist a submitted form payload as a `FormSubmission` record. Submissions are version-pinned: they record the exact `form_template_version_id` (UUID) that was active at the time of first submission, so historical data remains renderable even after the template has evolved through breaking changes.

### Database structure

The `form_submissions` table uses a polymorphic relation (`submittable_type` / `submittable_id`) so any model can own a submission without schema changes to that model:

```
form_submissions
  id                        uuid, PK
  submittable_type          string  (e.g. "Taily\Models\PreInspection")
  submittable_id            uuid
  form_template_version_id  uuid FK → form_template_versions.id (RESTRICT delete)
  data                      json
  created_at / updated_at
```

The FK is set to `RESTRICT` on delete — a template version cannot be removed while submissions reference it.

### Adding form submissions to a model

1. Add `use HasFormSubmission` to the Eloquent model (from `Taily\Traits\HasFormSubmission`).
2. This exposes a `formSubmission(): MorphOne` relation.
3. When persisting, create the submission inside a DB transaction alongside any other state changes:

```php
$model->formSubmission()->create([
    'form_template_version_id' => $latestVersion->id,
    'data'                     => $validatedFormData,
]);
```

4. Validate `$validatedFormData` against the template version before saving using `FormTemplateService::validateSubmissionData()`.

### Version pinning

The snapshot is taken **at first submission**, not at template assignment. This means:
- The inspector/user always sees the **latest** template version when opening a form.
- Once submitted, the `FormSubmission` locks to that specific version UUID.
- If the template is later updated to a new version, the submission still renders correctly against its pinned version.

---

## Frontend architecture

### DynamicFormFields (input rendering)

`src/components/form/DynamicFormFields.tsx` renders an editable form from a schema + uiSchema pair. It integrates with React Hook Form via `Controller` and reads validation errors from `useFormContext()`.

Key behaviours:
- Respects `ui:order` — renders fields in the declared order, then any unlisted fields at the end.
- Resolves display labels from `uiSchema[key]['ui:title']` (falls back to `schema.properties[key].title`, then the key itself).
- Resolves enum option labels from `uiSchema[key]['ui:options'].labels`.
- Handles heading fields (`ui:widget: heading` in uiSchema, absent from `properties`) as `<h3>` — no Controller, no validation.
- Switches (boolean fields) render their value as `!!field.value`, so `undefined` and `false` both show as "off".
- Use `namePrefix` (default `"form_data"`) so nested field names are `form_data.{key}` and don't collide with other form fields.

Usage:
```tsx
<DynamicFormFields
  schema={template.schema}
  uiSchema={template.ui_schema}
  control={form.control as unknown as Control<FieldValues>}
  namePrefix="form_data"
  disabled={false}
/>
```

> The `as unknown as Control<FieldValues>` cast is required because `DynamicFormFields` accepts a loosely-typed `Control<FieldValues>`, while the calling form is typed to its specific form data shape. This is a safe cast — the component only reads field values and errors, it never writes outside the prefix namespace.

### Validation (resolver-side)

When `DynamicFormFields` is used inside a form with a `zodResolver`, the JSON Schema must be converted to a matching Zod schema so the resolver can validate the dynamic fields. Two utilities handle this:

**`jsonSchemaToZod(schema)`** (`src/components/form/jsonSchemaToZod.ts`)

Converts a `JsonSchema` to a Zod schema that mirrors the validation rules in `DynamicFormFields`. Handles all supported field types with the following semantics:

| Field type | Validation behaviour |
|---|---|
| `string` (required) | Rejects `undefined` and `""` with "Dieses Feld ist erforderlich" |
| `string` (optional) | Accepts `undefined` and `""` |
| `string` + `minLength` | Enforces character minimum |
| `string` + `maxLength` | Enforces character maximum |
| `string` + `format: email` | Validates email address format |
| `number` / `integer` (required) | Rejects `undefined` with "Dieses Feld ist erforderlich" |
| `integer` | Additionally rejects floats with "Bitte eine ganze Zahl eingeben" |
| `minimum` / `maximum` | Enforces numeric range |
| `multipleOf` | Enforces step (e.g. `0.5` → rejects `5.3`, accepts `5.5`) |
| `enum` (required) | Rejects `undefined` and unknown values |
| `enum` (optional) | Accepts `undefined`; still rejects unknown values |
| `boolean` (optional) | Coerces `undefined` → `false` (untouched switch = off) |
| `boolean` (required) | Must be `true` — an untouched or off switch fails validation |

**`useDynamicFormSchema(staticSchema, jsonSchema)`** (`src/components/form/useDynamicFormSchema.ts`)

Memoised hook that combines a static Zod object schema (for non-dynamic fields like `verdict`, `notes`) with the Zod schema produced by `jsonSchemaToZod`, merging them under a `form_data` key:

```ts
const mainStaticSchema = z.object({
  verdict: z.enum(['approved', 'rejected'], { error: 'Bitte wähle ein Ergebnis aus' }),
  notes: z.string(),
})

// Inside component:
const schema = useDynamicFormSchema(mainStaticSchema, template?.schema)
const form = useForm<FormData>({
  resolver: zodResolver(schema) as never,
  defaultValues: {
    verdict: undefined,
    notes: '',
    form_data: buildFormDataDefaults(template?.schema, existingData),
  },
})
```

The `as never` cast on `zodResolver` is required because the dynamic `form_data` field is typed as `z.ZodTypeAny` (whose inferred type is `any`), causing a resolver type mismatch that TypeScript cannot narrow automatically.

**`buildFormDataDefaults(schema, existingData?)`** (`src/components/form/jsonSchemaToZod.ts`)

Builds the initial `form_data` object for `defaultValues`. Every property key defined in the schema is included in the returned object (with its value from `existingData` or `undefined`).

This is critical for `FormBlocker` correctness: react-hook-form's `isDirty` check does a structural deep-equal between current values and `defaultValues`. If `defaultValues.form_data` starts as `{}` and `DynamicFormFields` registers Controllers for `form_data.agree`, `form_data.full_name`, etc., the tracked form values gain keys that were absent from the defaults — making the form appear dirty immediately, even with no user input.

Always use `buildFormDataDefaults` when constructing `defaultValues` for a combined form, and also in any `form.reset()` calls after a successful save.

### DynamicFormDisplay (read-only rendering)

`src/components/form/DynamicFormDisplay.tsx` renders submitted data in read-only `<dl>` form. It uses the same `ui:order` and label resolution logic as `DynamicFormFields`.

- Booleans → "Ja" / "Nein"
- Enum values → resolved label from `ui:options.labels` (falls back to raw value)
- Empty / null / undefined values → "–"
- Heading fields → `<h3>` separator

Usage:
```tsx
<DynamicFormDisplay
  schema={submission.form_template.schema}
  uiSchema={submission.form_template.ui_schema}
  data={submission.data}
/>
```

### FieldTypeDefinition registry

`field-types/index.ts` holds a `Map<FieldType, FieldTypeDefinition>`. All field type logic is encapsulated inside its definition object — the editor and dialog are type-agnostic and just call the appropriate interface methods.

To add a new field type: create a file under `field-types/`, implement the `FieldTypeDefinition` interface, and register it in the map.

---

## Known constraints and open issues

- **No conditional logic** — fields cannot be conditionally shown or hidden based on other field values. All fields are always present in the schema.
- **`additionalProperties: false`** is always emitted by the builder, meaning every property key must be explicitly declared. This prevents stale keys from slipping through after fields are renamed.
- **Version history is kept forever** — there is no cleanup or archival mechanism for old versions. Old versions can be viewed via the versions endpoint but cannot be edited.
- **Race condition on submission** — if a template is updated between the inspector opening the public link and submitting, they submit against the new template. Acceptable edge case; may be addressed in future by sending the template version ID with the submission.
- **Renaming a field key always triggers a new version** (if submissions exist) — even if only the display label changes, because `SchemaChangeAnalyzer` compares property keys.
