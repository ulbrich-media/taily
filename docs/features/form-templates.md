# Form Templates

Form templates are reusable, versioned schemas that define the structure of dynamic forms used throughout Taily — for example a veterinary inspection report or an adoption application. They decouple the _shape_ of a form from any specific feature, so the same builder infrastructure can power any form-based workflow.

---

## Concepts

### Type

Every template belongs to a **type** — a free-form string identifier such as `inspection` or `application`. A type is the stable identity of a form across versions. The API always exposes the latest version for each type by default.

### Version

Whenever a template is edited in a way that would break already-submitted data, a **new version** is created automatically rather than overwriting the existing one. The old version is preserved so historical submissions remain valid against the schema they were filled against. See [Versioning](#versioning) below for the exact rules.

### Schema format

Each template stores two complementary documents:

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
| `number` | `type: number` or `integer` | — |
| `checkbox` | `type: boolean` | — |
| `select` | `type: string` + `enum: [...]` | — |
| `radio` | `type: string` + `enum: [...]` | `ui:widget: radio` |
| `date` | `type: string`, `format: date` | — |
| `email` | `type: string`, `format: email` | — |
| `phone` | `type: string` | `ui:widget: phone` |
| `heading` | `type: null` | `ui:widget: heading` |

**Heading** is a layout-only element — it carries no validation meaning and produces no key in submitted data. Renderers must handle `type: null` or `ui:widget: heading` fields explicitly and skip them when collecting submission data.

Each field type implements the `FieldTypeDefinition` interface (`field-types/types.ts`), which enforces a consistent contract:

- `toSchemaProps` / `toUiSchemaProps` — serialization to the stored documents
- `fromSchemaProp` — deserialization back to editor state
- `defaultSettings` / `buildSettings` / `getFormDefaults` — round-trip through the settings form
- `SettingsSection` — the React component rendered inside the edit dialog for type-specific options
- `settingsChips` — short badge labels shown on the field card (e.g. "2–50 Zeichen")

---

## Versioning

The backend automatically decides whether a save is an **in-place update** or a **new version**. The decision is made by `SchemaChangeAnalyzer` by comparing the old and new schemas.

### Breaking changes → new version

A new version is created when:
- An existing property is **removed**
- A property's **type** changes
- A field is added to **`required`** (already-submitted data may lack that field)
- An **enum value is removed** (existing submissions may contain that value)
- A numeric or string **constraint is tightened** (higher `minimum`, lower `maximum`, added `minLength`/`maxLength`)
- `additionalProperties: false` is **added** (previously accepted extra keys are now rejected)

### Non-breaking changes → in-place update

A save updates the existing record when:
- Only **labels, titles, or descriptions** change
- A new **optional** field is added (not in `required`)
- An **enum value is added** (more permissive)
- A constraint is **loosened** (lower minimum, higher maximum, removed limit)
- `additionalProperties: false` is **removed**

When the frontend receives `new_version_created: true` in the response it navigates to the new template ID so the URL and query cache stay correct.

---

## Form submissions

### Overview

Any model can persist a submitted form payload as a `FormSubmission` record. Submissions are version-pinned: they record the exact `form_template_id` (UUID) that was active at the time of first submission, so historical data remains renderable even after the template has evolved through breaking changes.

### Database structure

The `form_submissions` table uses a polymorphic relation (`submittable_type` / `submittable_id`) so any model can own a submission without schema changes to that model:

```
form_submissions
  id                 uuid, PK
  submittable_type   string  (e.g. "Taily\Models\PreInspection")
  submittable_id     uuid
  form_template_id   uuid FK → form_templates.id (RESTRICT delete)
  data               json
  created_at / updated_at
```

The FK is set to `RESTRICT` on delete — a template version cannot be removed while submissions reference it.

### Adding form submissions to a model

1. Add `use HasFormSubmission` to the Eloquent model (from `Taily\Traits\HasFormSubmission`).
2. This exposes a `formSubmission(): MorphOne` relation.
3. When persisting, create the submission inside a DB transaction alongside any other state changes:

```php
$model->formSubmission()->create([
    'form_template_id' => $templateId,
    'data'             => $validatedFormData,
]);
```

4. Validate `$validatedFormData` against the template before saving using `FormTemplateService::validate()`.

### Version pinning

The snapshot is taken **at first submission**, not at template assignment. This means:
- The inspector/user always sees the **latest** template when opening a form.
- Once submitted, the `FormSubmission` locks to that specific template UUID.
- If the template is later updated to a new version, the submission still renders correctly against its pinned version.

---

## Attaching form templates to features

Templates are assigned to features via dedicated named foreign-key columns (not a generic slot or pivot table). This makes the intent explicit and allows each feature to have multiple independent form types in the future.

### Animal types

`animal_types` currently has one named slot:

| Column | Purpose |
|---|---|
| `pre_inspection_form_template_id` | Form shown to the inspector during a pre-inspection |

When an animal type has no template assigned the feature falls back to verdict + notes only (acceptable default — the dynamic fields card is simply not shown).

To add a new form type to animal types: add a named FK column via migration, update `AnimalType::$fillable`, add a `belongsTo` relation, and expose it through the resource.

---

## Pre-inspection flow

Pre-inspections are the first feature that uses form submissions. The flow covers two distinct phases separated by `submitted_at`.

### Pre-submission phase

- The public link is active (token only valid while `submitted_at IS NULL`).
- The inspector opens the link and sees the latest form template (if any) plus the verdict/notes fields.
- The admin can only change the assigned inspector. All other fields are locked in the admin UI.

### Submission

Both the inspector (public token endpoint) and the admin (authenticated endpoint) perform a **first submission** in the same way:

1. Validate `verdict`, `notes`, and `form_data` (against the pinned template schema).
2. In a DB transaction:
   - Create a `FormSubmission` pinned to the current template version.
   - Set `verdict`, `notes`, and `submitted_at` on the `PreInspection`.
3. The public token becomes invalid immediately after.

Admin endpoint: `POST /pre-inspections/{id}/submit`  
Public endpoint: `POST /public/pre-inspections/{token}/submit`

### Post-submission phase

- The public link is no longer valid.
- The admin can edit `verdict`, `notes`, `form_data` (validated against the pinned template), and `inspector_id`.
- Form data is displayed read-only via `DynamicFormDisplay`; an edit toggle switches to `DynamicFormFields` inline.
- Edits go through `PUT /pre-inspections/{id}` — the `form_data` key is only accepted post-submission.

---

## Backend API

### Form template endpoints

All endpoints live under the internal API and are controller-routed through `FormTemplateController`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/form-templates` | List all types, latest version of each |
| `GET` | `/form-templates/{type}/versions` | All versions of a type, newest first |
| `GET` | `/form-templates/{id}` | A specific template by ID |
| `POST` | `/form-templates` | Create a new template (auto-increments version for the type) |
| `PUT` | `/form-templates/{id}` | Update a template (may create new version) |
| `POST` | `/form-templates/{id}/validate` | Validate a `data` payload against the template's JSON Schema |

Validation (`/validate`) returns `200` with `valid: true` or `422` with a flat `errors` map (`field => string[]`).

### Pre-inspection submission endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/pre-inspections/{id}/submit` | internal | Admin first-submission |
| `POST` | `/public/pre-inspections/{token}/submit` | token | Inspector first-submission |

---

## Frontend architecture

### Form builder (admin)

The editor works with an internal `EditorField[]` list richer than the stored JSON Schema: each entry holds a parsed, typed representation of one field plus two runtime flags:

```ts
interface EditorField extends FormField {
  _deleted?: boolean   // soft-deleted (existing fields only)
  _isNew?: boolean     // added in this editing session, not yet saved
}
```

Deleted existing fields remain in the list (shown crossed out) so they can be restored before saving. Truly new fields that are deleted are removed immediately.

`schema.ts` owns the two conversion functions:

- `parseJsonSchema(schema, uiSchema) → EditorField[]` — run on load
- `buildJsonSchema(fields, title) → { schema, uiSchema }` — run on save

`useFieldBuilder` manages all editor state, including drag-and-drop (`@dnd-kit/core`), dirty tracking, and auto-generated field keys (`text_1`, `select_2`, …).

### DynamicFormFields (input rendering)

`src/components/form/DynamicFormFields.tsx` renders an editable form from a schema + uiSchema pair. It integrates with React Hook Form via `Controller` and reads validation errors from `useFormContext()`.

Key behaviours:
- Respects `ui:order` — renders fields in the declared order, then any unlisted fields at the end.
- Resolves display labels from `uiSchema[key]['ui:title']` (falls back to `schema.properties[key].title`, then the key itself).
- Resolves enum option labels from `uiSchema[key]['ui:options'].labels`.
- Handles heading fields (`type: null` or `ui:widget: heading`) as `<h3>` — no Controller, no validation.
- Per-field validation rules are built from the JSON Schema (`required`, `minLength`, `maxLength`, `minimum`, `maximum`, email pattern).
- Use `namePrefix` (default `"form_data"`) so nested field names are `form_data.{key}` and don't collide with other form fields.

Usage:
```tsx
<DynamicFormFields
  schema={template.schema}
  uiSchema={template.ui_schema}
  control={form.control}
  namePrefix="form_data"
  disabled={false}
/>
```

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

## Data flow summary

```
Admin edits fields in FormBuilderEditor
  ↓ useFieldBuilder tracks state + drag-and-drop
  ↓ buildJsonSchema() serializes EditorField[] → { schema, uiSchema }
  ↓ PUT /form-templates/{id}
  ↓ FormTemplateService.updateTemplate()
      ↓ SchemaChangeAnalyzer decides: in-place or new version
      ↓ FormTemplate::create() or $template->update()
  ↓ Response: { data, new_version_created }
  ↓ Frontend navigates to new ID (if new version) or resets form state

Inspector submits via public link
  ↓ POST /public/pre-inspections/{token}/submit
      { verdict, notes, form_data }
  ↓ FormTemplateService validates form_data against latest template
  ↓ DB transaction:
      FormSubmission::create({ form_template_id, data })
      PreInspection: verdict, notes, submitted_at = now()
  ↓ Token becomes invalid; admin sees post-submission view

Admin edits post-submission
  ↓ PUT /pre-inspections/{id}
      { verdict, notes, form_data, inspector_id }
  ↓ form_data validated against pinned FormSubmission.formTemplate
  ↓ FormSubmission.data updated; verdict/notes saved on PreInspection
```

---

## Known constraints and open issues

- **No conditional logic** — fields cannot be conditionally shown or hidden based on other field values. All fields are always present in the schema.
- **`additionalProperties: false`** is always emitted by the builder, meaning every property key must be explicitly declared. This prevents stale keys from slipping through after fields are renamed.
- **Version history is kept forever** — there is no cleanup or archival mechanism for old versions. Old versions can be viewed via the versions endpoint but cannot be edited.
- **Race condition on submission** — if a template is updated between the inspector opening the public link and submitting, they submit against the new template. Acceptable edge case; may be addressed in future by sending the template ID with the submission.
- **Renaming a field key always triggers a new version** — even if only the display label changes, because `SchemaChangeAnalyzer` compares property keys. 
