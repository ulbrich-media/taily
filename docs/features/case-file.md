# Case File

> **Status: prototype on branch `prototype/adoption-based-structure`.** This describes the target design from [ADR-015](../ADRs/ADR-015-adoption-case-file.md). Implemented so far: the catalogue per animal type with its settings UI (*Einstellungen → Angaben*), Field Values, Requirement Overrides, the Checklist (adoption overview, transport page, contract blocking) mediator editing in the adoption's *Angaben* tab, and contract templates as configuration (*Einstellungen → Verträge*). Not implemented: file fields and review actions, requesting data (`requested_step`), the applicant portal, the audit trail and notifications.

The Case File (German UI: *Angaben*) is everything an adoption knows about *if and how* it can happen: the applicant's living situation, their experience, documents, photos, contract data, transport details. It belongs to the **adoption**, not to the person. The person only identifies a human (see [data-scheme.md](../data-scheme.md#person)).

Organizations configure which fields exist and when they are needed. Taily's code owns the process — the fixed steps `application`, `pre_inspection`, `contract`, `transport`, `handover` (see [adoption.md](./adoption.md)). That split is the core idea: **configure fields, not the process.**

---

## Concepts at a glance

| Concept | German UI | What it is |
|---|---|---|
| **Field Definition** | Feld | One configurable field: type, label, when it is asked, when it is required, who sees it |
| **Built-in Field** | Standardfeld | A Field Definition backed by a Person column (name, address, …). Configurable, not deletable |
| **Field Group** | Abschnitt | A titled section that orders fields and Info Blocks |
| **Info Block** | Hinweis | Informative text placed between fields; collects no data |
| **Field Value** | Angabe | The value of one field for one adoption |
| **Requirement Override** | Anforderung | A mediator's per-adoption change: require, waive, or move a field's due step |
| **Checklist** | Checkliste | Derived: what is missing or awaiting review for a step |

---

## One catalogue per animal type

Every animal type has its **own** catalogue of groups and fields, configured under *Einstellungen → Angaben → [Tierart]*. What is configured on *Hund* is exactly what a dog adoption asks; editing *Hund* never changes *Katze*. The price is some duplication between animal types, which **"Von anderer Tierart kopieren"** keeps cheap: it replaces a catalogue with a copy of another one, as long as no adoption holds data for it yet.

Keys are unique per animal type, so the same key (e.g. `has_garden`) can exist on several types. A new animal type starts with the built-in fields in a group *Über dich*.

The settings show each group as a card with its fields: type, when it is asked and required, its condition and flags. Groups and fields are reordered with up/down buttons; a field moves to another group from its edit page. A group can only be deleted when it is empty, and fields are archived rather than deleted.

## Field Definitions

```
field_definitions
  id
  animal_type_id        the catalogue it belongs to
  key                   stable identifier, unique per animal type, never changes: "living_space_sqm"
  field_group_id        where it is shown
  position              order inside the group
  type                  see below
  label, help           German UI text
  options               enum values, min/max, max files, …
  collect_at            step at which the field is first asked
  required_for          step from which it is required; null = optional
  requires_review       a mediator has to confirm the value
  visible_to_applicant  asked in forms, shown and editable in the portal
  visible_to_inspector  shown on the pre-inspection page
  condition             nullable: only applies if another field has a given value
  archived_at
```

### Types

`text`, `textarea`, `number`, `integer`, `boolean`, `select`, `radio`, `date`, `email`, `phone`, `photo`, `video`, `document`, and the layout type `info` (an Info Block).

File types (`photo`, `video`, `document`) store files through Spatie media on the Field Value and allow a maximum number of files. Video size is limited by what the hosting allows (`upload_max_filesize`/`post_max_size`) for now; chunked uploads may come later.

### Built-in fields

The Person's identity columns appear in the catalogue as built-in fields: `first_name`, `last_name`, `email`, `phone`, `mobile`, `address` (street, postal code, city, country as one composite field), `date_of_birth`. Their group, position, `collect_at`, `required_for` and visibility are configurable like any other field; they cannot be archived, and their type is fixed. Name and email are always collected at application, because they identify the person.

Their values are stored on the Person, not as Field Values, because identity is shared across adoptions. Editing them from an adoption edits the Person (and is recorded in the Person's [audit trail](./audit-trail.md)).

### `collect_at` and `required_for`

Steps have a nominal order: `application` → `pre_inspection` → `contract` → `transport` → `handover`. The order is only used for data requirements; the steps themselves stay optional and may happen in any order.

- **`collect_at`** — the first step whose form asks for the field.
- **`required_for`** — the first step that needs it; it stays required for every later step. Must not be earlier than `collect_at`. `null` means optional.

Two settings are needed because "asked" and "needed" are often different:

| Field | `collect_at` | `required_for` | Why |
|---|---|---|---|
| Name, email | application | application | Identifies the person |
| Wohnfläche (m²) | application | application | Part of deciding whether it fits |
| Anschrift | application | contract | Usually given right away, but only needed for the contract |
| Hausvideo | application | — | Offered at application; the mediator requires it case by case |
| Vermieterbestätigung | pre_inspection | — | Only relevant for tenants; requested per adoption |
| Ausweisnummer | contract | contract | Not asked before it is needed |
| Foto Sicherheitsgeschirr | transport | transport | Asked once the transport is planned, reviewed by the mediator |

### Changing a definition

Labels, help, group, position, steps and flags can always be changed. The **type and key cannot**: a field whose meaning or type changes gets a new key and the old one is archived. Archived fields keep their existing values and stay visible on old adoptions, but are no longer asked. This replaces the schema versioning the form builder needs.

**Changes apply live to all active adoptions** (`unconfirmed`, `pending`, `in_progress`). Requirements are derived, never snapshotted per adoption, so a new required application field immediately shows up as missing on every running adoption — and as an open request in the portal of applicants whose requested step already covers it. No emails are sent automatically; the mediator sees it on the checklist and requests or waives it. Done and canceled adoptions have no checklist and keep their values. Archiving a field removes it from every checklist.

---

## Field Groups and Info Blocks — structuring 30+ fields

An application alone can have 30 fields, plus more for pre-inspection, contract and transport. Two independent axes keep that manageable:

- **Groups decide *where*** a field is shown — the same for every audience and every step.
- **Steps decide *when*** a field is shown.

Every form and view is "all groups, in order, filtered to the fields relevant here"; **groups that end up empty are hidden.** An organization structures its fields once, and every form follows from it.

```
field_groups
  id, animal_type_id, title, intro (optional text), position
```

Info Blocks are entries of type `info` inside a group, ordered like fields. They are shown wherever their group is shown, and their `collect_at` controls from which step on they appear.

What an organization can customize: groups (title, intro, order), which group each field is in, field order inside a group, and Info Blocks anywhere. Not customizable: per-audience layouts. The applicant, mediator and inspector see the same structure, filtered differently.

### Example catalogue (dog adoption)

```
Über dich
  Vorname, Nachname, E-Mail, Telefon          built-in · application
  Geburtsdatum                                built-in · application → required for contract
  Anschrift                                   built-in · application → required for contract
  Beruf / Arbeitszeiten                       textarea · application

Wohnsituation
  ℹ "Wir fragen das, um einschätzen zu können, ob das Tier zu dir passt."
  Wohnform (Haus / Wohnung)                   select   · application · required
  Wohnfläche (m²)                             integer  · application · required
  Garten vorhanden                            boolean  · application
  Größe des Gartens (m²)                      integer  · application · required · only if Garten vorhanden = ja
  Vermieter mit Tierhaltung einverstanden     boolean  · application · required
  Vermieterbestätigung                        document · pre_inspection · optional, requested per adoption · review
  Hausvideo                                   video    · application · optional, requested per adoption

Erfahrung & Alltag
  Bisherige Hundeerfahrung                    textarea · application · required
  Weitere Tiere im Haushalt                   textarea · application
  Wie lange wäre der Hund täglich allein?     text     · application · required

Für den Vertrag
  Ausweisnummer                               text · contract · required · hidden from inspector

Ankunft
  ℹ "Ein Sicherheitsgeschirr hat einen zusätzlichen Bauchgurt. Ein normales
     Halsband oder Brustgeschirr reicht nicht – bitte fotografiere es."
  Foto Sicherheitsgeschirr                    photo · transport · required · review
  Telefonnummer am Transporttag               phone · transport · required
```

The application form shows *Über dich*, *Wohnsituation* (without the landlord confirmation), and *Erfahrung & Alltag*. *Für den Vertrag* and *Ankunft* stay hidden until their steps are requested.

---

## Conditional fields

> Planned as part of the design, built after the core (catalogue, values, checklist).

Some questions only make sense after another answer: *"Garten vorhanden?"* → *"Wie groß ist der Garten?"*. Without conditions the second field can only be optional — skipped by those without a garden, but also by those who have one. With a condition it can be **required, but only when it applies**.

```
condition: { "field": "has_garden", "equals": true }
condition: { "field": "housing_type", "in": ["apartment"] }     → Vermieter einverstanden?
```

Deliberately limited:

- **One condition per field**: equality (`equals`) or membership (`in`) on a `boolean`, `select` or `radio` field.
- **The controlling field must come earlier** in the catalogue order. That rules out cycles and keeps forms readable top to bottom. Chains are allowed (C depends on B depends on A).
- No AND/OR, no number comparisons. If that is ever needed, it extends this column; it doesn't replace it.

A field whose condition is not met **doesn't apply**. It is not asked, not shown, not required and not on the checklist. Its value is kept if it was filled in earlier (the audit trail shows it), but it is not displayed or printed while the condition is not met. A Requirement Override cannot make a non-applying field required.

Where it touches the code — each is small, which is why this is not hard to add if the column is planned from the start:

| Place | Change |
|---|---|
| Catalogue editor | Pick a controlling field (earlier, boolean/select/radio) and the value(s) |
| Forms (frontend) | Watch the controlling value and show/hide the field |
| Frontend validation | `required` becomes conditional (a `superRefine` in the generated Zod schema) |
| Backend validation | Maps directly to Laravel's `required_if` / `exclude_unless` |
| Checklist, portal, inspector page, contract | One shared "does this field apply?" check (animal type + condition) |

## Field Values

```
adoption_field_values
  id, adoption_id, field_definition_id
  value              json
  review_status      null | pending | confirmed | rejected
  review_note        text, shown to the applicant when rejected
  reviewed_by, reviewed_at
  (+ media for file types)
```

One row per adoption and field holds the **current** value. History lives in the [audit trail](./audit-trail.md), not in extra rows.

Who can write:

- **Applicant** — through the application form and the [portal](./applicant-portal.md), for fields with `visible_to_applicant`.
- **Mediator** — every field, always. Information often arrives by phone or WhatsApp, and corrections after a pre-inspection are made here.

There is no field ownership and no locking. Every write goes through one action, which records the change in the audit trail and, for `requires_review` fields, resets the review status to `pending`. When the applicant changes something after the application was submitted, the mediator is notified.

### Review

For `requires_review` fields, a value only counts as present once a mediator has **confirmed** it.

> **Example — Sicherheitsgeschirr.** The applicant uploads a photo of an ordinary collar. The mediator rejects it with "Das ist ein Halsband, bitte ein Sicherheitsgeschirr mit Bauchgurt fotografieren." The portal shows the note and asks for a new photo. The new upload sets the status back to `pending`; the mediator confirms. The old photo stays in the audit trail.

A value the mediator enters themselves is confirmed implicitly.

Rejecting a value sends the applicant **one email per rejection**: the field's label, the mediator's note and a portal link — never the value itself, since personal data doesn't belong in an email.

### Replacing files

Replacing a file never deletes the old one. It is detached from the current value and stays reachable from the audit trail. Otherwise a replaced landlord confirmation with different wording could not be told apart from the original. Permanent removal (a mediator cleanup action, GDPR erasure) is planned separately and not part of this design.

---

## Requirement Overrides

The catalogue sets defaults. The mediator decides per adoption:

```
adoption_requirements
  adoption_id, field_definition_id
  required_for   step | null   → overrides the default; null with waived = false means "optional"
  waived         bool          → not needed for this adoption at all
```

| Situation | Override |
|---|---|
| Finding a pre-inspection appointment is hard → ask for a home video instead | Hausvideo: `required_for = pre_inspection` |
| Something in the application seems off | Hausvideo: `required_for = pre_inspection` |
| Applicant is a tenant | Vermieterbestätigung: `required_for = pre_inspection` |
| Applicant owns the house | Vermieterbestätigung: `waived` |
| Adopter picks the animal up personally, no transport | Foto Sicherheitsgeschirr: `waived` |

Making a field required for a step that has already been requested sends it to the applicant immediately (email + portal).

**Effective requirement** for a field on an adoption, in order of precedence:

1. The adoption's override, if any.
2. Otherwise the stricter (earlier) of the definition's `required_for` and the active contract templates of the animal's type (every field they mark as required is required for `contract`; see [ADR-016](../ADRs/ADR-016-contract-templates-as-configuration.md#several-templates-requirements-per-animal-type)).

Fields that don't apply — a [condition](#conditional-fields) that isn't met — are never required.

---

## Requesting data — split collection

Each adoption tracks how far data collection has been opened, in `adoptions.requested_step`:

- Submitting the application sets it to `application`.
- The mediator advances it with an action such as **"Angaben für den Vertrag anfordern"**. Taily emails the applicant a link to a form that contains exactly the fields that are visible to the applicant, have `collect_at` up to that step, and are still missing or rejected — plus any fields made required by an override.
- The portal shows every applicant-visible field with `collect_at` up to `requested_step`.
- `requested_step` only moves forward.

So the applicant is only asked for what is needed now, and a short application lowers the barrier to apply.

**Manual, with suggestions.** Requests are never sent automatically — the mediator controls when the applicant hears from the organization. At the natural points Taily suggests the next request:

| Mediator action | Suggestion |
|---|---|
| Confirms the pre-inspection | *"Angaben für den Vertrag jetzt anfordern? (2 fehlen)"* |
| Assigns a transport | *"Angaben für den Transport anfordern? (Foto Sicherheitsgeschirr, Telefonnummer)"* |
| Makes a field required through an override | Sent immediately |

If nothing is missing for that step, there is no suggestion and `requested_step` moves forward silently, so the portal shows those fields. *"Erneut erinnern"* resends the request for open items; there are no automatic reminders.

---

## Checklist

The Checklist answers one question: **what is still missing for step X?** It is a single service, `AdoptionChecklist::for($adoption, $step)`, with pure, unit-testable logic:

```
items = every field effectively required for $step (or an earlier step)
        that applies to the animal's type
status per item:
  missing          no value (or a rejected value)
  awaiting review  requires_review and status pending
  done             value present (and confirmed, if review is required)
```

It covers Case File fields, the built-in Person fields of the applicant, and — through the contract templates of the animal's type — the animal and mediator fields that the contract prints.

Where it is used:

- **Adoption page** — the summary at the top, e.g. *"Für den Vertrag fehlen 2 Angaben, 1 Prüfung offen"*.
- **Contract generation** — blocked while a field the chosen template requires is missing (waived items don't count).
- **Transport page** — aggregates the transport checklist over all assigned adoptions: *"Tour Süd: 3 von 8 Adoptionen vollständig"* with the missing items per adoption. No more checking every animal and person by hand. See [transport.md](./transport.md#checklist).

Other steps are not blocked by the checklist; the mediator decides.

---

## How the Case File appears

### Mediator — adoption page

The adoption page has three tabs: **Übersicht**, **Angaben**, **Verlauf**. The adoption only shows and edits information; how fields are configured lives in the settings.

- **Übersicht**: the steps, plus a compact **Checkliste** per step that opens on the first incomplete one, with links where missing animal or mediator data has to be fixed.
- **Angaben**: every group in catalogue order, with a group menu (and the number of open items per group) and a filter **"Nur offene"**. Each group is edited as a whole in a dialog, where conditional fields appear and disappear while typing.
- Each field shows its value first; badges only flag what needs attention (*Fehlt*, *Prüfung offen*, *Für diese Vermittlung angepasst*), and the requirement is a short grey note. Later: the last change (*"vom Bewerber geändert am 12.11."*) linked to the audit trail.
- Fields that apply but haven't been requested yet are shown greyed: *"noch nicht angefragt"*.
- A filter toggle: **all / only missing / only for step X**.
- Per field: require, waive or move the due step (Requirement Override).
- A **marker for applicant changes**: *"3 Änderungen durch Bewerber seit 12.11."* with a jump to the audit trail and a **"Gesehen"** button. Changes to fields printed in an already generated contract are highlighted.

#### Change notifications

The marker is **per adoption, not per user**: `adoptions.applicant_changes_seen_at`. Every applicant change after the application was submitted counts until someone clicks "Gesehen". Since each adoption has one responsible mediator, one user's "Gesehen" clearing it for everyone is accepted.

- The adoption list shows a badge and offers the filter *"Ungesehene Änderungen"*.
- The **assigned mediator** gets a **daily summary email** of unseen changes (applicants often change several fields in a row, so not one email per change). Without an assigned mediator there is only the badge. The summary runs through the scheduler, like the contract signing reminders.

### Applicant — forms and portal

- The **application form** and each **request form** are paginated by group: one group per page, with a progress indicator. Empty groups are skipped.
- The **portal** shows the same groups read-only with an edit action per group, plus the open requests (missing and rejected items) at the top. See [applicant-portal.md](./applicant-portal.md).

### Inspector — pre-inspection page

The same groups, read-only, limited to fields with `visible_to_inspector`. Contract data like the Ausweisnummer stays hidden. See [pre-inspection.md](./pre-inspection.md).

---

## Second adoption by the same person

Values belong to the adoption — a snapshot of what was true for that decision. Reuse is explicit:

- **Cross-reference** — the adoption page lists the person's earlier adoptions and pre-inspections (read-only), e.g. *"Bereits eine Vorkontrolle für Bello (Hund) am 03.04., Ergebnis: geeignet"*.
- **Import** — *"Aus früherer Adoption übernehmen"*: the mediator in the admin, or the applicant in the portal, picks an earlier adoption and the values to copy. Files are copied (Spatie `copyMedia`); the duplicates are an accepted cost. Imported values of `requires_review` fields start as `pending` again — a landlord confirmation from half a year ago gets reviewed again, not trusted blindly. Every imported value is recorded in the audit trail as an import.

---

## Not supported (deliberately)

- **Complex conditions** — AND/OR, comparisons, conditions across adoptions. One equality condition per field only.
- **Filtering or sorting the adoption list by custom field values.**
- **Per-audience layouts.** One structure, filtered per audience.
- **Locking fields** after contract generation. The change notification warns instead; see [ADR-015](../ADRs/ADR-015-adoption-case-file.md#lock-fields-once-they-are-in-a-generated-contract).
