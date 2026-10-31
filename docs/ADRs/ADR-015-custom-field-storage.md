# ADR-015: Custom Field Definition and Storage

## Status

Proposed

## Context

The Operating Organization needs to add its own fields to Animals and Persons (see [features/custom-fields.md](../features/custom-fields.md)). The fields must:

- appear on specific tabs (Basis, Medizinisch, …), including the create forms
- be scoped per animal type for animals and per role for persons (e.g. an ID card number only for adopters)
- carry settings a generic form does not have, such as public visibility
- be readable by contracts, the Public API, history and exports
- be fillable from application and report forms that do not exist yet

Taily already has a schema-driven form system ([features/form-templates.md](../features/form-templates.md)): a builder, JSON Schema + UI Schema, server-side validation, rendering components, and Form Submissions. Submissions are polymorphic, version-pinned, and limited to one per record by `unique(submittable_type, submittable_id)`. They were designed for one-time snapshots: an inspection result filled once and kept as written.

Custom field values are different. They are live master data, edited repeatedly over a record's lifetime and expected to always show the current definition.

## Decision

**Custom fields are defined by Form Templates, bound to an entity by a new `custom_field_groups` table. Their values are stored in a `custom_fields` JSON column on the entity's own table, validated against the latest template version, and not version-pinned.**

- **Definitions reuse Form Templates.** No second field editor, no second validator, no second set of rendering components. One template per Field Group.
- **The binding is its own table.** `custom_field_groups` holds entity, section, scope (a set of animal types or of person roles), position, title and **per-field settings** (`field_settings` JSON, keyed by field key). Placement and custom-field-only settings therefore never leak into the generic template. The same template stays usable as a plain form.
- **Splitting fields across tabs means binding several groups**, one per section. Sections are a fixed enum, starting with animal Basis and "Weitere Angaben" and person Basis.
- **"Required" has one meaning**, the template's JSON Schema `required`, enforced when the field's section is saved. Who it applies to follows from the group's scope; there is no separate rule tying fields to process steps.
- **Values live in a JSON column on the entity**, as one flat key → value object. Keys are **unique per entity**, enforced when a group or a bound template is saved. A field shared by several animal types is one group bound to several types.
- **No version pinning for values.** They are validated and rendered against the latest version.
- **Filled fields stay visible.** A group is shown for a record if the record is in its scope *or* holds a value for one of its keys. Scope changes (an animal's type, a person's roles) therefore never delete or hide data. Out of scope, a field is just no longer required, and emptying a field removes its key.
- **Removing a definition deletes its values.** Custom fields can hold personal data, so a removed field, option or type change, or a deleted group, deletes the affected values in the same transaction. Each such change needs an explicit confirmation, which the backend enforces with a 409 carrying the impact. Together with the previous rule, every stored value is visible somewhere.
- **Keys are locked once a template is bound**, because contracts and website integrations reference them.
- **Form Submissions stay what they are**, the snapshot store for forms such as pre-inspections and future applications. Application data reaches entities through *linked fields*: copies of entity field definitions inside an application template, applied when a mediator accepts the application.

## Consequences

### Positive

- One field editor and one validation path for every dynamic form in Taily.
- Reading custom fields needs no join. They come with the row, for detail views, lists, the Public API and contracts alike.
- Deleting a record deletes its values. No polymorphic cleanup is needed, unlike `form_submissions`, whose morph has no foreign key.
- History, export and GDPR features treat custom fields as one more attribute of the record.
- List filters can be added later with `JSON_EXTRACT` scopes, or with generated columns where a field becomes hot, without changing the storage.

### Negative

- Custom field values have no history of their own definition. A value written against an older version of a template is shown with the current label and options. This is accepted, because the record is live data. Historical accuracy is the job of the planned history feature and of frozen artifacts such as contracts.
- Removing a field, option or group is destructive and cannot be undone. Re-adding it starts empty. The confirmation step and the impact shown in it are the only safeguard.
- Other stores that copy custom field values have to honour removals themselves. Future history entries must be deleted or redacted with them. Frozen contract PDFs and Form Submissions are deliberately out of scope.
- The key uniqueness rule spans several templates. It has to be checked whenever a group or a bound template changes, not just inside one template. Different animal types cannot have different definitions under the same key.
- Records can carry filled fields from groups no longer in scope. The UI has to mark them, and validation has to drop `required` for them.
- A JSON column is not indexed. Large-scale filtering on a custom field needs a generated column.
- Linked fields copy definitions, so a copy can drift from its source. The builder has to detect and flag the drift.

## Alternatives Considered

- **One Form Submission per record per group.** This reuses the existing table, but needs a discriminator column and a relaxed unique constraint. Every read pays a polymorphic join, and deletes need explicit cleanup. Version pinning would also be wrong for data that is edited constantly: either every save re-pins to the latest version, which makes pinning pointless, or old records keep rendering against outdated definitions.
- **An EAV table (`custom_field_values` with one row per value).** It is query-friendly per field, but it needs one typed column per value type or string-cast values, many rows per record, and joins for every read. This is too heavy for Taily's scale.
- **Keeping values of removed fields as hidden orphans**, so that undoing a removal brings them back. This was rejected because of GDPR: personal data no one can see would still have to be found and covered in every access or deletion request.
- **Deleting values when a record leaves a group's scope** (lost role, changed animal type). This keeps only in-scope data, but it turns ordinary edits into destructive operations that each need a confirmation flow, and it would make deleting an adoption delete person data. Keeping filled fields visible achieves the GDPR goal (no invisible data) without any of that.
- **Keys unique only among groups with overlapping scope**, so dogs and cats could define `expected_size` differently. This needs overlap checks for every validation and removal, and a key would no longer mean one thing, which also breaks keeping filled fields visible across a type change.
- **A dedicated custom field definitions table with its own editor.** It would duplicate the form builder, the field types, the validation and the renderers.
- **Requirements tied to process steps** (e.g. "required before contract generation"). Steps belong to the adoption, while the data belongs to the person or animal, so scoping by role expresses the same need ("adopters must provide an ID card number") without a second rule layer. A non-blocking notice on the adoption covers "make sure it's there before the contract".
- **Custom fields on Adoptions.** No candidate field held up: payments, handover and transport have their own features, and application answers live in the application's Form Submission. The `entity` column keeps adding Adoptions a small change.
- **One template per entity, with tab placement and settings stored in the template's `ui_schema`.** This needs no extra table, but it couples a generic form to one entity's UI. The builder would need a custom-field mode, and the same template could not be reused elsewhere. Per-animal-type scoping would still need a binding somewhere.
