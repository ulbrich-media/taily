# Custom Fields

Custom fields let the Operating Organization add its own fields to **Animals** and **Persons**, on top of the fields Taily ships with. Typical examples:

- an "ID card number" that every adopter has to provide
- an "expected size" on a dog, a select with classifications such as "Klein", "Mittel", "Groß", published through the Public API so the website can visualize how large the dog will become

Custom fields are **defined with the existing form builder** ([form-templates.md](./form-templates.md)). There is no second field editor. A Form Template becomes a set of custom fields by being bound to an entity through a **Field Group**.

The storage decision and the alternatives that were rejected are recorded in [ADR-015](../ADRs/ADR-015-custom-field-storage.md).

> **Status:** proof of concept. Phases 1 and 2 and the backend plus builder side of Phase 3 are implemented; the PR introducing them lists what is still open. The [Implementation plan](#implementation-plan) at the end splits the work into phases.

### Why not Adoptions

Adoptions get no custom fields in this version. Every candidate turned out to belong somewhere else:

| Candidate | Where it belongs |
|---|---|
| Agreed fee, payments | Payment tracking ([#230](https://github.com/ulbrich-media/taily/issues/230)) |
| Handover or transport details | The handover and transport features |
| Motivation, living situation, "how did you hear about us" | The application's Form Submission ([#231](https://github.com/ulbrich-media/taily/issues/231)), which stays attached to the adoption |
| Special conditions for the contract | The adoption notes, until a concrete need appears |

Foster adoptions ([#252](https://github.com/ulbrich-media/taily/issues/252)) may bring a real need. The `entity` column of Field Groups keeps adding Adoptions a small change.

---

## Concepts

### Field Group

A **Field Group** binds one Form Template to one entity, at one place in the UI, for one scope. It answers these questions:

| Question | Stored in | Example |
|---|---|---|
| Which fields? | `form_template_id` | Template "Größe & Gewicht" |
| On which entity? | `entity` | `animal` |
| Where in the UI? | `section` | `basic` (Basis tab, and therefore also the create form) |
| For which animals? | `custom_field_group_animal_type` | Dog and cat. No entries means all animal types. Animal groups only |
| For which persons? | `person_roles` | `["adopter"]`. Empty means every person. Person groups only |

It also holds a `title` (shown as the section heading, defaulting to the template name), a `position` (order among groups in the same section), and the **per-field settings** described below.

An entity can have any number of Field Groups. Splitting fields between the Basis tab and the "Weitere Angaben" tab means creating one group for each.

```
custom_field_groups
  id                uuid, PK
  entity            string     animal | person
  section           string     see "Sections" below
  person_roles      json       array of roles, [] = every person      (person only, see "Scope")
  form_template_id  uuid FK → form_templates, restrict on delete
  title             string
  position          unsigned int
  field_settings    json       per-field settings, keyed by field key
  created_at / updated_at

  unique (entity, form_template_id)

custom_field_group_animal_type                                         (animal only)
  custom_field_group_id  uuid FK → custom_field_groups, cascade on delete
  animal_type_id         uuid FK → animal_types, cascade on delete
  primary (custom_field_group_id, animal_type_id)
```

Animal types are a pivot table rather than a JSON array so that deleting an animal type cleans up after itself. Roles are a fixed enum, so a JSON array is enough.

The group points at the **parent** `form_templates` row and always uses its latest version, the same way `animal_types.pre_inspection_form_template_id` does.

### Sections

Sections are a fixed list defined in code (`CustomFieldSection` enum, with German labels):

| Entity | Section | Where it renders | Part of the create form? |
|---|---|---|---|
| animal | `basic` | Tab "Basis", after "Beschreibungen" | yes (`AnimalCreatePage` reuses `AnimalFormBasic`) |
| animal | `extra` | New tab "Weitere Angaben", only shown when at least one group uses it | no |
| person | `basic` | Tab "Basis & Kontakt", after "Adresse" | yes, for groups without a role (see below) |

Within a section, each group renders as its own `FormSection` titled with the group title, ordered by `position`, after the core sections.

Sections are deliberately few and not free-form. A free list of tabs would need a tab editor and its own routing, and would make "which fields are on the create form" unpredictable. More sections, such as the animal tabs "Medizinisch", "Vermittlung" and "Status", or a person section on "Rollen", can be added to the enum later without a model change.

**Section and scope are independent.** The section decides *where* a group renders, and the scope decides *for whom*. A group scoped to `adopter` with section `basic` shows the ID card number on the Basis tab, but only for adopters.

### Scope

A group's scope decides which records the group is **in scope** for. For a record in scope, the group is offered, and its required fields are enforced.

**Animals** are scoped by a set of animal types. A group with no animal types is in scope for every animal. Binding one template to several types, such as "Erwartete Größe" for dogs and cats, keeps a single key that a website can read for every animal type.

**Persons** are scoped by a set of **roles**. A group with no roles is in scope for every person. Otherwise it is in scope for persons holding at least one of its roles:

| Role | A person holds it when… | Source |
|---|---|---|
| `adopter` | they are the applicant of at least one adoption, in any status | `adoptionsAsApplicant` (`Person::scopeWhereHasAdoptions`) |
| `mediator` | they are a mediator for at least one animal type | `mediator_animal_types` |
| `inspector` | they are an inspector for at least one animal type | `inspector_animal_types` |
| `foster` | they are a foster for at least one animal type | `foster_animal_types` |

The ID card number therefore goes into a group scoped to `adopter`. It is offered only for people who have applied, and only required from them. A mediator's or inspector's record doesn't offer it.

`adopter` deliberately covers the whole lifecycle from Applicant to Adopter, including canceled adoptions. The data is collected once someone applies, and it doesn't become irrelevant when an adoption is canceled. The glossary's distinction between Applicant and Adopter is about the adoption's status, not about which data the person has to provide.

Role scoping does not distinguish animal types: "foster for dogs" and "foster for cats" get the same groups. If organizations need that distinction, person groups can gain animal types later.

### Filled fields stay visible

A record's scope changes over time. An animal's type can be corrected, a person gains or loses a role, an adoption is deleted. None of this deletes or hides data. The rule is:

> A group is **shown** for a record if it is in scope **or** the record has a value for at least one of its keys.

- **Gaining scope** (a person becomes an applicant, a role is assigned) adds the group. Its required fields apply from the next save, see [Records that become incomplete](#records-that-become-incomplete).
- **Losing scope** (a role is removed, an animal's type changes) changes nothing about the stored values. The group stays shown while it holds values, marked "Trifft nicht mehr zu". Its fields stay editable but are no longer required. Once all its fields are emptied, the group disappears.
- **Emptying a field removes its key** from the record rather than storing `''`. A cleared value is really gone, not just hidden.

So nothing is ever stored that nobody can see. That is the GDPR property the [removal process](#removing-values) also relies on, and it holds without deleting data on every change of scope. Scope changes therefore need no confirmation. This is safe because keys are unique per entity (next section): a leftover value can never collide with a field of the new scope.

### Field keys

The JSON Schema property key of a template field (e.g. `expected_size`) is the custom field's identity. The **key** is what the database stores, what contract templates reference, and what the Public API returns. Because of this:

- **Keys are unique per entity.** A key exists in at most one group of an entity, so it always means the same field. This is checked when a group is created and when a bound template is saved: "Der Feldname `expected_size` wird bereits in der Gruppe ‚Größe' verwendet." Fields shared between animal types are shared by binding one group to several types, not by repeating the key.
- **Keys are locked once a template is bound.** The builder already warns that renaming a key does not carry over existing data. For a bound template, the "Feldname" input of saved fields becomes read-only, and the backend rejects a save that renames a key (removal is a separate case, see below). A renamed key would silently break contract templates and website integrations.
- The existing key rules apply unchanged: `^[a-z][a-z0-9_]*$`, at most 100 characters.

Because a template is bound to at most one group per entity (`unique (entity, form_template_id)`), and keys are unique per entity, a key always identifies exactly one group.

### Per-field settings

Some settings only make sense for a field used as a custom field, not for a field in a generic form. They live on the Field Group in `field_settings`, keyed by field key, not in the template's `ui_schema`:

```json
{
  "expected_size": { "public": true },
  "coat_type":     { "public": false }
}
```

| Setting | Meaning | Allowed for |
|---|---|---|
| `public` | Returned by the Public API | animal only (no Public API exposes persons) |

Missing entries mean "all off". Entries for keys the template no longer has are ignored, and cleaned up the next time the group is saved.

Keeping these settings on the group means a Form Template stays a plain, reusable form, and the builder needs no custom-field mode. The settings are edited in the Field Group dialog. For animal groups, that dialog lists the template's fields with their label and type, each with a "Öffentlich" toggle. Person groups currently have no per-field settings.

---

## Required fields

"Required" has one meaning: the existing "Pflichtfeld" toggle in the form builder, which puts the key into the template's JSON Schema `required`. Who it applies to comes from the group's **scope**, not from a separate rule. A required field in an `adopter` group is required from adopters, and only from them.

A required field **must be filled whenever its section is saved, for a record the group is in scope for**:

- On **create**, the in-scope groups of the create section (`basic`) are validated in full. For animals, those are the groups of the chosen animal type. A new person holds no role yet, so only person groups without a role apply on create. Fields on the "Weitere Angaben" tab are not enforced on create, because that tab is not part of the create form.
- On **update**, every group the request touches is validated. A request touches a group if it carries at least one of the group's keys. The frontend always sends every key of every group shown on the tab being saved, so saving a tab validates exactly the groups on that tab. For groups that are shown but no longer in scope, types and constraints are still validated, but `required` is not.

This fits the typical flow. The mediator creates a person by phone without knowing the ID card number, so nothing is required, because the person holds no role yet. The person becomes an applicant when the adoption is created. From then on, the ID card number is shown and required on their Basis tab.

### Records that become incomplete

A record can become incomplete without anyone saving it:

- a template edit adds a required field
- a record comes into scope of a group with required fields, e.g. a person is chosen as the applicant of a new adoption

Nothing is blocked and nothing is migrated. The next save of the affected tab requires the fields. Until then, the missing fields are shown in exactly two places:

- **The animal sidebar and the person sidebar** (`AnimalSidebar`, `PersonSidebar`), as "Fehlende Angaben" with the field labels. Each links to the tab where the field is edited.
- **The adoption's "Vertrag" step card**, listing the missing fields of the animal and the applicant, e.g. "Vor dem Vertrag fehlen: Ausweisnummer (Bewerber)". This is a notice, not a gate. Generating the contract stays possible.

The detail resources provide this as `custom_fields_missing: [{key, label, section}]`. `AnimalDetailResource` and `PersonDetailResource` include it for the record itself, and `AdoptionDetailResource` includes it for its animal and applicant.

Required fields are deliberately not tied to process steps such as contract generation. Steps belong to the adoption, while the data belongs to the person or animal. Scoping by role already says who has to provide what, and the notice on the contract card covers the "make sure it's there before the contract" need without a second rule layer.

---

## Storing values

Values live in a **`custom_fields` JSON column on the entity's own table** (`animals`, `people`): a flat object of key → value.

```json
{ "expected_size": "large", "coat_type": "long" }
```

- Cast as `array`. Default `{}` is set in the model's `$attributes`, following the [empty-strings](../coding-patterns/empty-strings.md) convention of model-level defaults.
- Values are JSON-native: string, number, boolean, `YYYY-MM-DD` string for dates. A key that is absent means "not set". Emptying a field removes its key, so there are no `''` or `null` entries.
- Values are **not version-pinned**. Unlike a Form Submission, custom field data is live master data, edited many times. It is always rendered and validated against the **latest** version of the bound template. Templates bound as custom fields normally have no submissions, so `SchemaChangeAnalyzer` updates them in place anyway.
- **Every stored key belongs to a field that exists.** When a field's definition goes away, its values are deleted, see [Removing values](#removing-values). Together with [filled fields stay visible](#filled-fields-stay-visible), this means every stored value is also visible.
- Deleting the record deletes its values. No polymorphic cleanup is needed, which matters for the planned delete features ([#249](https://github.com/ulbrich-media/taily/issues/249), [#251](https://github.com/ulbrich-media/taily/issues/251)).

### Writing values

The internal store and update endpoints of both entities accept an optional `custom_fields` object next to the core fields. `CustomFieldService` then:

1. Rejects keys that no group of the entity defines (422 on `custom_fields.<key>`).
2. Determines the groups to validate: the in-scope groups of the create section on create, and the touched groups on update. On animal create, the animal type is taken from the request. For a person, the roles are taken from the stored record.
3. For each of these groups, validates the existing values merged with the request's values, restricted to the group's keys, using `JsonSchemaValidator`. `required` is only applied to in-scope groups. Because the data is restricted to the group, the builder's `additionalProperties: false` works unchanged. Errors are returned as `custom_fields.<key>`.
4. Merges the request's values into the column, removing keys whose new value is empty, and saves in the same transaction as the core attributes.

---

## Removing values

Custom fields can hold personal data, such as an ID card number. Data that no field shows anymore must not linger in the database, where no one can see it but it still has to be covered by GDPR requests. Scope changes never cause this, see [filled fields stay visible](#filled-fields-stay-visible). Only the disappearance of a field's **definition** does, and then the values are deleted in the same transaction as the change.

### What triggers a removal

| Change | Values deleted | Confirmed in |
|---|---|---|
| Field removed from a bound template | that key, in every record of the entity | form builder, on save |
| Option removed from a select or radio field | values equal to the removed option | form builder, on save |
| Field type changed | that key (treated as removed and re-added) | form builder, on save |
| Field Group deleted | all its keys, in every record of the entity | delete dialog |

Because keys are unique per entity, a removal never has to check whether another group still uses the key. It applies to every record of the entity.

Changes that make a value *invalid* but not *obsolete* do not delete anything. Examples are a newly required field or a tightened `maxLength`. The value stays, and the next save of its tab requires fixing it.

### Confirmation

A removal cannot be undone. Re-adding a field starts empty. Every save that would delete values therefore needs explicit confirmation, enforced by the backend rather than the UI:

1. The save request is sent as usual.
2. If it would delete values and does not carry `confirm_custom_field_removal: true`, the backend changes nothing and answers **409** with the impact: `[{key, label, option?, count}]`.
3. The frontend shows a confirmation dialog built from that answer, e.g. "Ausweisnummer wird bei 14 Personen gelöscht. Das kann nicht rückgängig gemacht werden."
4. On confirmation, the same request is sent again with the flag.

Since the impact is computed by the same code that performs the deletion, the dialog always shows exactly what will happen. A stale client or a direct API call cannot delete data silently.

### Execution

`CustomFieldCleanup` computes the impact and performs the deletion. The deletion is a bulk update per key, synchronous inside the request's transaction. Taily runs on shared hosting without a queue (see [release-architecture.md](../release-architecture.md)), and the data volume per installation is small:

```sql
UPDATE people
SET custom_fields = JSON_REMOVE(custom_fields, '$."id_card_number"')
WHERE JSON_CONTAINS_PATH(custom_fields, 'one', '$."id_card_number"')
```

Removed select options use the same statement, with an additional condition on `JSON_UNQUOTE(JSON_EXTRACT(custom_fields, '$."<key>"')) = ?`.

### What the removal does not touch

- **Generated contracts.** Values printed into a contract PDF are frozen with it. The contract is a legal record of what was signed and follows the retention rules for contracts, not the custom field definition (see [ADR-012](../ADRs/ADR-012-contract-generation-and-signing.md#legal-questions-and-accepted-risk)).
- **Form Submissions** (e.g. applications with linked fields). They record what the applicant wrote and follow the retention of their owner, such as the application.
- **History** ([#248](https://github.com/ulbrich-media/taily/issues/248), [#250](https://github.com/ulbrich-media/taily/issues/250)). The history feature stores changes to `custom_fields` too. It must therefore delete or redact the history entries of a key when its values are removed, or it would keep exactly the data this process deletes. This is a requirement on the history feature.

---

## Showing values

### Admin UI

The frontend loads definitions from one endpoint, because the create forms need them before a record exists:

- `GET /internal/custom-fields/definitions?entity=animal&animal_type_id=…` returns the in-scope groups for a new animal of that type.
- `GET /internal/custom-fields/definitions?entity=person` returns the groups without a role, for a new person.
- `GET /internal/custom-fields/definitions?entity=animal&record_id=…` (or `entity=person&record_id=…`) returns the groups **shown** for an existing record. Scope and stored keys are resolved server-side.

The response lists the groups, each with `{id, title, section, position, in_scope, field_settings, template: {version_id, schema, ui_schema}}`.

The Base resources (`AnimalBaseResource`, `PersonBaseResource`) add `custom_fields`. The Detail resources add `custom_fields_missing`, see [Records that become incomplete](#records-that-become-incomplete).

Rendering reuses the existing dynamic form components:

- A new `CustomFieldSections` component takes a section's groups and renders one `FormSection` per group, containing `DynamicFormFields` with `namePrefix="custom_fields"`. Groups with `in_scope: false` get the "Trifft nicht mehr zu" marker. All groups share the flat `custom_fields.<key>` namespace, which is possible because keys are unique per entity.
- `useDynamicFormSchema` gains a key parameter (`form_data` stays the default), so a tab's static zod schema can be extended with `custom_fields`. The schemas of the section's groups are merged into one object before calling `jsonSchemaToZod`, with `required` removed for groups that are not in scope. `buildFormDataDefaults` builds the defaults, as described in form-templates.md for `FormBlocker` correctness.
- `DynamicFormFields` gets an optional `FormGrid` layout, so custom fields line up with the two-column core forms.
- The animal create page re-queries the definitions when the selected animal type changes, and rebuilds the `custom_fields` defaults.
- The definitions of an existing record are re-queried after saves that can change its scope: an animal's type on the Basis tab, a person's roles on the "Rollen" tab.
- "Fehlende Angaben" in `AnimalSidebar` and `PersonSidebar`, and the notice on the adoption's "Vertrag" step card.
- A shared `useCustomFieldRemovalConfirm` hook handles the 409 → dialog → resend loop, used by the form builder and the group delete dialog.
- 422 responses: there is no mapping of backend validation errors onto fields in the admin entity forms yet. A small helper maps `custom_fields.*` errors with `setError`. Client-side zod validation covers the normal case, but the server is authoritative, for example after a concurrent template edit.

### Server-side presentation

Contracts, the Public API, history and exports all need the same thing: the fields of a record, in order, with label and a formatted value. A single backend layer provides this, so no consumer re-implements label lookup or formatting:

- `$model->customFields()` returns a `CustomFieldValues` collection of `CustomFieldValue {key, label, type, value, display, group, section, in_scope, settings}`. It covers the shown groups' fields, in section → group position → `ui:order` order.
- `$model->customField('expected_size')` returns the display string (`''` if unset). `$model->customFieldValue('expected_size')` returns the raw value.
- Formatting follows `DynamicFormDisplay`: booleans as "Ja"/"Nein", enum values as their `ui:options.labels`, dates as `d.m.Y`, decimals with a German decimal comma.
- Definitions are loaded once per request per entity and memoized. There are only a handful of groups per entity, so scope resolution happens in memory. This lets list endpoints and the Public API index serialize many records without N+1 queries on groups and versions.

---

## Contract and mail templates

**Contracts.** `ContractPdfService::resolveViewAndData()` already passes the Eloquent models (`$animal`, `$applicant`, `$mediator`, `$adoption`) to the Blade view, so custom fields need no new view data:

```blade
Ausweisnummer: {{ $applicant->customField('id_card_number') }}
```

Putting a custom field into the contract means referencing it in the (overridden) Blade template, like any other contract value ([ADR-013](../ADRs/ADR-013-contract-template-rendering.md)). The default template stays unchanged. Values are frozen into the PDF at generation, like every other contract value, so later edits do not affect a generated contract. `/dev/contracts/preview` picks this up with no changes.

**Mails.** Mailables currently pass a few scalars (animal name, recipient name, URLs), and mail texts are only customizable through Blade overrides. No mail needs custom fields today, so v1 changes nothing here. When a mail needs one, the Mailable passes the model and the template uses the same accessor.

**Placeholder convention.** If user-editable templates (mail or contract) are ever built, custom fields are addressed as `animal.custom.<key>` and `applicant.custom.<key>` (or `mediator.custom.<key>`, …, by the person's part in the adoption). The presenter above is the value source. This reserves the naming now, so keys stay stable references.

---

## Public API

### Reading animals

`PublicAnimalResource` adds `custom_fields`. It contains every field with `public: true` in a group **in scope** for the animal's type. Each such field is **always present** (value `null` when unset), so the shape is stable per animal type. Leftover values from groups no longer in scope are not published.

```json
"custom_fields": {
  "expected_size": { "label": "Erwartete Größe", "type": "select", "value": "large", "display": "Groß" },
  "coat_type":     { "label": "Fellart", "type": "select", "value": "long", "display": "Langhaar" }
}
```

`type` is the builder's Field Type, not the JSON Schema type, because that tells a website what kind of value it gets. For selects, `value` is the stable option key a website maps its visualization to (`small` / `medium` / `large`), and `display` is the label shown to visitors.

`GET /animal-types` (`PublicAnimalTypeResource`) adds the public custom field **definitions** of each type: `[{key, label, type, options?: [{value, label}], minimum?, maximum?}]`. A website can then build filters, legends or a size visualization without having to fetch an animal first. The order of `options` is the order from the builder, so "Klein → Mittel → Groß" can be rendered as a scale.

No new token ability is needed, because the values travel with the existing `animals:read:adoptable` and `animals:read:types` abilities. Person custom fields are never exposed by the Public API.

`openapi.yaml` gets `CustomFieldValue` and `CustomFieldDefinition` schemas, using `additionalProperties` for the key-indexed object. While editing the spec, also fix the existing drift: the `Animal` schema documents `internal_notes`, which `PublicAnimalResource` does not return.

Filtering the public animal list by a custom field (e.g. "large dogs only") is a later extension. See [Lists](#lists-search-and-filters).

### Writing (future submit endpoints)

The planned write endpoints accept custom fields the same way the internal ones do, validated by the same `CustomFieldService`:

- **Adoption applications** ([#231](https://github.com/ulbrich-media/taily/issues/231) internally, [#242](https://github.com/ulbrich-media/taily/issues/242) via the Public API with a new ability such as `adoptions:create:application`). The application form is a Form Template per animal type, submitted as a Form Submission. Its link to person fields is described in [Linked fields](#linked-fields).
- **Animal reports by organisations** ([#241](https://github.com/ulbrich-media/taily/issues/241)). These are the same pattern targeting animal fields.

Each such endpoint also publishes the form it expects (e.g. `GET /api/animals/{id}/application-form` → `schema`, `ui_schema`), so a website can render it with any JSON Schema form library. The published schema contains only the form, never `field_settings` or the link metadata.

---

## Linked fields

Application and report forms collect data that later belongs to a Person or an Animal. The applicant's ID card number, entered in the application, should end up in the person's `id_card_number` custom field. These forms need full control over wording and order, so instead of assembling them from entity fields, the form builder gets a new Field Type: **linked field** ("Feld übernehmen").

### In the builder

- Picking "Feld übernehmen" opens a picker: target entity (person or animal), then a field. The field can be a **linkable core field** or a **custom field** of that entity.
- Linkable core fields are a whitelist in one backend registry (`LinkableFields`), e.g. person: `first_name`, `last_name`, `email`, `phone`, `mobile`, `date_of_birth`, the address fields; animal: `name`, `breed`, `gender`, `color`, `date_of_birth`, … It is exposed as `GET /internal/custom-fields/linkable?entity=person` with a JSON Schema fragment and label per field. Custom fields come from the Field Groups, with their scope shown. Since custom field keys are unique per entity, a link only needs the entity and the key.
- When inserted, the builder **copies** the target field's schema fragment and label into the template and records the link in the `ui_schema`:

  ```json
  // ui_schema
  "person_id_card_number": {
    "ui:title": "Ausweisnummer",
    "ui:options": { "link": { "entity": "person", "field": "custom.id_card_number" } }
  }
  ```

  Copying keeps a Form Template self-contained. `DynamicFormFields`, `DynamicFormDisplay`, `jsonSchemaToZod`, `SchemaChangeAnalyzer` and Form Submission validation all keep working without knowing about links, and a submission stays renderable after the target field changes.
- The key is generated as `<entity>_<field>` and locked. Label, description and placeholder can be reworded freely, which is the point of having the field in the form. Type and options cannot be changed.
- If the copied fragment no longer matches its source (type or options changed, or source removed), the builder flags the field ("Quelle geändert – aktualisieren") and offers to re-copy it.
- Wherever an application form template is assigned (per animal type, with #231), the assignment shows which required `adopter` fields the form does not link: "Nicht im Formular abgefragt: Ausweisnummer". This is a hint, not an error. The mediator can still fill the field on acceptance.

### When the data is used

Links do nothing on submit. They are applied when a mediator acts on the submission:

- **Accepting an application** opens the person form, **pre-filled** from the linked values. Since the person becomes the applicant, the form already shows and validates the groups without a role **and** the `adopter` groups. A required ID card number that the application didn't ask for is simply filled in by the mediator. Normal `CustomFieldService` validation applies, so a stale or invalid linked value surfaces as an ordinary form error instead of being written silently.
  - **New person:** the "create person" form, pre-filled.
  - **Existing person** (same email): the mediator chooses to use that person. The form then shows **a per-field choice** for every linked field where the stored value and the application's value differ: "Bisher: … / Aus Bewerbung: …", defaulting to the stored value. Fields that are empty on the person are pre-filled from the application. Fields where both values are equal are shown normally. Nothing on an existing person is overwritten without the mediator choosing it.
- **Approving an animal report** works the same way with the animal create form.

The Form Submission stays attached to the application as the record of what the applicant actually wrote, pinned to its version as usual.

`LinkedFieldValues::extract(FormSubmission)` returns `['person' => ['core' => […], 'custom' => […]], 'animal' => […]]`, and the accept and approve flows use it to fill the forms.

Linked fields in a template used for anything else, such as a pre-inspection form, behave like plain fields, because no flow applies them there.

The fixed fields an application always needs to create a Person (#231: name and email) stay part of the application flow itself and are not template fields. A template cannot remove them.

---

## Managing Field Groups

- **Settings → "Zusatzfelder"**, a new card on `SettingsPage`, **admin only**. The frontend uses the usual `beforeLoad` guard. The backend routes use the existing but so far unused `admin` middleware alias.
- The list is grouped by entity, then section, showing title, template, scope (animal types or roles) and number of fields. It is small and bounded, so it is a plain list per [list-views.md](../coding-patterns/list-views.md).
- The create/edit routed dialog has: entity → section (filtered by entity) → animal types (animal) or roles (person), as a multi-select where empty means "alle" → template (`FormTemplateSelect`) → title → position → the per-field settings table. Key conflicts with other groups are shown inline.
- Changing a group's scope never deletes values, see [filled fields stay visible](#filled-fields-stay-visible). Deleting a group deletes its values after the [removal confirmation](#confirmation).
- The form builder shows where a template is used ("Verwendet als Zusatzfelder: Person › Basis (Adoptanten)") and locks saved keys of bound templates. Saving a bound template that removes fields or options, or changes a type, goes through the removal confirmation.

Editing values is open to every user who can edit the record, like core fields.

---

## Lists, search and filters

Not part of v1. Custom fields do not appear in list columns, search, filters or sorts. The intended extension, following [list-views.md](../coding-patterns/list-views.md) and [ADR-014](../ADRs/ADR-014-list-view-data-handling.md):

- `filter[cf.<key>]` for enum, boolean and number fields, implemented as a scope over `JSON_EXTRACT(custom_fields, '$.<key>')`. The key is validated against the entity's definitions, so the whitelist rule ("unknown filters are a 422") still holds.
- Search over text custom fields with the same `LIKE` approach.
- If a field becomes a hot filter, a MySQL generated column with an index can be added for it without changing the request contract.
- The same filter syntax on the Public API's `GET /animals`, limited to `public` fields.

---

## Relation to other planned features

| Feature | Impact |
|---|---|
| [#231](https://github.com/ulbrich-media/taily/issues/231) / [#242](https://github.com/ulbrich-media/taily/issues/242) Applications | Use [Linked fields](#linked-fields). The accepted applicant becomes an `adopter`, so adopter-scoped fields apply in the accept form. The application form template is chosen per animal type, alongside `pre_inspection_form_template_id`. |
| [#241](https://github.com/ulbrich-media/taily/issues/241) Animal reports | Linked animal fields, and the animal create form for approval. |
| [#248](https://github.com/ulbrich-media/taily/issues/248) / [#250](https://github.com/ulbrich-media/taily/issues/250) History | `custom_fields` is an attribute of the record, so it is diffed like any other column. The history view diffs per key and labels the changes with the presenter ("Erwartete Größe: Mittel → Groß"). History entries of a key must be deleted or redacted when its values are [removed](#what-the-removal-does-not-touch). |
| [#240](https://github.com/ulbrich-media/taily/issues/240) Export, [#239](https://github.com/ulbrich-media/taily/issues/239) TASSO, [#255](https://github.com/ulbrich-media/taily/issues/255) Findefix | The general export flattens custom fields into `custom.<key>` columns via the presenter. Registry exports map fixed core fields and can later also map a custom field through the same link notation (`custom.<key>`). |
| [#246](https://github.com/ulbrich-media/taily/issues/246) / [#249](https://github.com/ulbrich-media/taily/issues/249) / [#251](https://github.com/ulbrich-media/taily/issues/251) Deletion | Values are deleted with the row. Deleting an adoption can take a person's `adopter` role away. That needs no special handling, because their filled fields simply stay visible. Person custom fields can contain personal data (ID card number), so they are covered by any future GDPR deletion or export automatically. |
| [#252](https://github.com/ulbrich-media/taily/issues/252) Foster adoptions | Whoever takes an animal into a foster home through an adoption is its applicant, and therefore an `adopter` under the role table above. If foster homes need different data than final adopters, the `adopter` role splits by adoption kind. This is also the most likely trigger for adoption custom fields (see [Why not Adoptions](#why-not-adoptions)). |
| [#256](https://github.com/ulbrich-media/taily/issues/256) Form grouping | Headings, and later sections inside a template, render inside a group's `FormSection` as usual. Multi-step forms are irrelevant for entity tabs and are ignored there. |
| [#233](https://github.com/ulbrich-media/taily/issues/233) Inspections on adoptions | No impact. |

---

## Implementation plan

Each phase can ship on its own, and later phases build on earlier ones.

### Phase 1: Foundation (definitions, storage, admin UI)

Backend:
- Migration: `custom_fields` JSON column on `animals` and `people`; `custom_field_groups` and `custom_field_group_animal_type` tables.
- Models: `CustomFieldGroup`; `HasCustomFields` trait on Animal and Person (cast, default, `customFields()`, `customField()`, `customFieldValue()`).
- Enums `CustomFieldSection` (entity → sections) and `CustomFieldPersonRole` (with German labels and the role resolution from the table above).
- `CustomFieldDefinitions` (load and memoize an entity's groups; resolve in-scope and shown groups for a record) and `CustomFieldService` (validate and merge, as described in [Writing values](#writing-values)).
- Key uniqueness check per entity, run on group save and on saving a bound template (`FormTemplateRequest`). Reject key renames on bound templates.
- `CustomFieldCleanup` (impact and deletion) for the four [removal triggers](#what-triggers-a-removal), with the `confirm_custom_field_removal` flag and the 409 impact response.
- Admin-only CRUD `/internal/custom-field-groups`; `GET /internal/custom-fields/definitions`.
- `custom_fields` in the store/update requests and the Base resources; `custom_fields_missing` in `AnimalDetailResource`, `PersonDetailResource` and, for animal and applicant, `AdoptionDetailResource`.

Frontend:
- Settings card "Zusatzfelder", list, and create/edit/delete dialogs, including the per-field settings table.
- `CustomFieldSections`, generalized `useDynamicFormSchema`, `FormGrid` layout for `DynamicFormFields`, and a `custom_fields.*` 422 mapping helper.
- Integration: animal Basis tab and create (reacting to the type), the new "Weitere Angaben" tab, person Basis tab and create, re-querying definitions after type or role changes.
- "Fehlende Angaben" in both sidebars and on the "Vertrag" step card.
- Form builder: "Verwendet als" banner, key lock, and `useCustomFieldRemovalConfirm` with its dialog (also used by the group delete dialog).
- Hand-written types in `src/api/types/*` (`custom_fields: Record<string, unknown>`) and a `custom-fields` types module.

Tests:
- validation on create and update: touched groups, unknown keys, required only in scope, emptying removes the key
- scope resolution: animal types, each person role, multiple roles, gaining and losing scope
- shown groups for out-of-scope values
- key uniqueness
- the four removal triggers, the 409 without the flag, and that nothing changes on 409
- `custom_fields_missing`
- Vitest coverage for the merged zod schema (including `required` dropped out of scope), the defaults and the confirmation loop

### Phase 2: Output (contracts, Public API)

- `CustomFieldValues` presenter with formatting rules, shared by all consumers.
- Document the `customField()` accessor for contract templates in contract.md.
- `custom_fields` on `PublicAnimalResource`; definitions on `PublicAnimalTypeResource`; `openapi.yaml` updated (including the `internal_notes` drift).

### Phase 3: Linked fields

- `LinkableFields` registry and `GET /internal/custom-fields/linkable`.
- New "Feld übernehmen" Field Type in the `field-types/` registry: picker, copy-on-insert, locked key, stale-source detection.
- `LinkedFieldValues::extract()`. Only the extractor is built here; applying it, and the "not asked in the form" hint, are part of the #231 and #241 implementations.

### Later

List filters, search and columns; Public API filters; more sections (animal "Medizinisch", "Vermittlung", "Status"; person "Rollen"); person groups scoped by role **and** animal type; adoption custom fields if #252 needs them; history and export integration as those features land.

---

## Decisions

- **Keys are unique per entity.** A field shared by several animal types is one group bound to several types. See [Field keys](#field-keys).
- **Filled fields stay visible.** Scope changes (animal type, roles, deleted adoptions) never delete or hide values. Fields outside their scope are no longer required, and disappear once emptied. See [Filled fields stay visible](#filled-fields-stay-visible).
- **Removing a field's definition deletes its values**, immediately and after confirmation, because of GDPR. Together with the previous rule, no invisible data is ever kept. See [Removing values](#removing-values).
- **Sections start minimal:** animal Basis and "Weitere Angaben", person Basis. See [Sections](#sections).
- **Missing required fields are shown in the sidebars and on the "Vertrag" step card only.** See [Records that become incomplete](#records-that-become-incomplete).
- **Linked fields stay** as a dedicated Field Type, because application and report forms need full control over wording and order. See [Linked fields](#linked-fields).
- **Existing person on application acceptance:** a per-field choice between stored and submitted values. See [When the data is used](#when-the-data-is-used).
- **No units for number fields.** Size-like information is modelled as a select with named classifications ("Klein", "Mittel", "Groß"), which is easier to fill in and easier for a website to visualize.
- **One meaning of "required"**, scoped by animal type or person role. There is no rule tying fields to adoption steps. See [Required fields](#required-fields).
- **No adoption custom fields** in this version. See [Why not Adoptions](#why-not-adoptions).
