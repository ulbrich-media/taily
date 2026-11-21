# Case File

The Case File (German UI: *Angaben*) is everything an adoption knows about *if and how* it can happen: the applicant's identity and living situation, their experience, documents, photos, contract data, transport details. It belongs to the **adoption** ([ADR-016](../ADRs/ADR-016-adoption-case-file.md)); the applicant's name, contact and address are columns of the adoption itself ([ADR-018](../ADRs/ADR-018-applicant-data-on-the-adoption.md)).

Organizations configure which fields exist and when they are needed. Taily's code owns the process — the fixed steps `application`, `pre_inspection`, `contract`, `transport`, `handover` (see [adoption.md](./adoption.md)). That split is the core idea: **configure fields, not the process.**

## Implementation status

| Part | Status |
|---|---|
| Catalogue per animal type, settings UI (*Einstellungen → Angaben*), copying a catalogue | Implemented |
| Built-in fields on the adoption's applicant columns | Implemented |
| Field Values, conditions, Requirement Overrides | Implemented |
| Checklist on the adoption, the transport page, and blocking contract generation | Implemented |
| Mediator editing (adoption tab *Angaben*) | Implemented |
| Application form and portal for applicants | Implemented ([adoption.md](./adoption.md#application), [applicant-portal.md](./applicant-portal.md)) |
| Earlier adoptions and taking over their data | Implemented, without choosing single values |
| Review: mediator values confirmed, applicant values pending | Implemented |
| Review actions (confirm / reject with a note) and the rejection email | Planned |
| File fields (upload, display, keeping replaced files) | Planned — file fields can be configured but not filled |
| Requested Step and request forms | Planned — the portal derives the current step instead |
| Audit trail, change notifications | Planned |

---

## Concepts at a glance

| Concept | German UI | What it is |
|---|---|---|
| **Field Definition** | Feld | One configurable field: type, label, when it is asked, when it is required, who sees it |
| **Built-in Field** | Standardfeld | A Field Definition backed by one of the adoption's applicant columns (name, email, address, …). Configurable, not deletable |
| **Field Group** | Abschnitt | A titled section that orders fields and Info Blocks |
| **Info Block** | Hinweis | Informative text placed between fields; collects no data |
| **Field Value** | Angabe | The value of one field for one adoption |
| **Requirement Override** | Anforderung | A mediator's per-adoption change: require, waive, or move a field's due step |
| **Checklist** | Checkliste | Derived: what is missing or awaiting review for a step |

---

## One catalogue per animal type

Every animal type has its **own** catalogue of groups and fields, configured under *Einstellungen → Angaben → [Tierart]*. What is configured on *Hund* is exactly what a dog adoption asks; editing *Hund* never changes *Katze*. The price is some duplication between animal types, which **"Von anderer Tierart kopieren"** keeps cheap: it replaces a catalogue with a copy of another one, as long as no adoption holds data for it yet.

Keys are unique per animal type, so the same key (e.g. `has_garden`) can exist on several types. A new animal type starts with the built-in fields in a group *Über dich*.

The settings show each group as a card with its fields: type, when it is asked and required, its condition and flags. Groups and fields are reordered with up/down buttons; a field moves to another group from its edit page. A group can only be deleted when it is empty, and fields are archived rather than deleted. A field a [contract template](./contract.md#contract-templates) prints can't be archived until it is removed from the template.

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
  applicant_attribute   built-in fields only: the adoption column it stands for
  archived_at
```

### Types

`text`, `textarea`, `number`, `integer`, `boolean`, `select`, `radio`, `date`, `email`, `phone`, `photo`, `video`, `document`, and the layout type `info` (an Info Block).

File types (`photo`, `video`, `document`) are meant to store files through Spatie media on the Field Value and allow a maximum number of files. Video size is limited by what the hosting allows (`upload_max_filesize`/`post_max_size`) for now; chunked uploads may come later. *Not implemented yet:* file fields can be configured and required, but nobody can upload to them. The application doesn't block on a required file.

### Built-in fields

The applicant's columns on the adoption appear in every catalogue as built-in fields: `first_name`, `last_name`, `email`, `phone`, `mobile`, `address` (street, additional line, postal code, city, country as one composite field), `date_of_birth`. Their group, position, `collect_at`, `required_for` and visibility are configurable like any other field; they cannot be archived, and their type is fixed. Name and email are always collected at application, because they identify the applicant.

Their values are stored in the adoption's `applicant_*` columns, not as Field Values, because Taily's code relies on them: the full name in lists, mails and the contract; the email for linking adoptions and the portal; the address for the contract and, later, searching. The definition's `applicant_attribute` names the column. A correction applies to this adoption only — never to another adoption or a Person. The email is stored trimmed and lowercased.

### `collect_at` and `required_for`

Steps have a nominal order: `application` → `pre_inspection` → `contract` → `transport` → `handover`. The order is only used for data requirements; the steps themselves stay optional and may happen in any order.

- **`collect_at`** — the first step whose form asks for the field.
- **`required_for`** — the first step that needs it; it stays required for every later step. Must not be earlier than `collect_at`. `null` means optional.

Two settings are needed because "asked" and "needed" are often different:

| Field | `collect_at` | `required_for` | Why |
|---|---|---|---|
| Name, email | application | application | Identifies the applicant |
| Wohnfläche (m²) | application | application | Part of deciding whether it fits |
| Anschrift | application | contract | Usually given right away, but only needed for the contract |
| Hausvideo | application | — | Offered at application; the mediator requires it case by case |
| Vermieterbestätigung | pre_inspection | — | Only relevant for tenants; requested per adoption |
| Ausweisnummer | contract | contract | Not asked before it is needed |
| Foto Sicherheitsgeschirr | transport | transport | Asked once the transport is planned, reviewed by the mediator |

The application form and the portal show the difference to the applicant: a field required now is marked *Pflicht*, one asked early but needed later *Nötig für: Vertrag*.

### Changing a definition

Labels, help, group, position, steps and flags can always be changed. The **type and key cannot**: a field whose meaning or type changes gets a new key and the old one is archived. Archived fields keep their existing values and stay visible on old adoptions, but are no longer asked. This replaces the schema versioning the form builder needs.

**Changes apply live to all active adoptions** (`unconfirmed`, `pending`, `in_progress`). Requirements are derived, never snapshotted per adoption, so a new required application field immediately shows up as missing on every running adoption — and as an open item in the portal of applicants whose current step already covers it. No emails are sent automatically; the mediator sees it on the checklist and requests or waives it. Done and canceled adoptions have no checklist and keep their values. Archiving a field removes it from every checklist.

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

The application form shows *Über dich*, *Wohnsituation* (without the landlord confirmation), and *Erfahrung & Alltag*. *Für den Vertrag* and *Ankunft* stay hidden until their steps are reached.

---

## Conditional fields

Some questions only make sense after another answer: *"Garten vorhanden?"* → *"Wie groß ist der Garten?"*. Without conditions the second field can only be optional — skipped by those without a garden, but also by those who have one. With a condition it can be **required, but only when it applies**.

```
condition: { "field": "has_garden", "equals": true }
condition: { "field": "housing_type", "in": ["apartment"] }     → Vermieter einverstanden?
```

Deliberately limited:

- **One condition per field**: equality (`equals`) or membership (`in`) on a `boolean`, `select` or `radio` field.
- **The controlling field must come earlier** in the catalogue order. That rules out cycles and keeps forms readable top to bottom. Chains are allowed (C depends on B depends on A); a field whose controlling field doesn't apply doesn't apply either.
- No AND/OR, no number comparisons. If that is ever needed, it extends this column; it doesn't replace it.

A field whose condition is not met **doesn't apply**. It is not asked, not shown, not required and not on the checklist. Its value is kept if it was filled in earlier, but it is not displayed or printed while the condition is not met. A Requirement Override cannot make a non-applying field required.

One shared check decides whether a field applies: `ChecklistCalculator::applies()` on the server, and its counterpart in the frontend forms, which show and hide fields while the user types (the mediator's group dialog, the application form, the portal).

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

One row per adoption and field holds the **current** value. History will live in the [audit trail](./audit-trail.md), not in extra rows.

Who can write:

- **Applicant** — through the application form and the [portal](./applicant-portal.md), for fields with `visible_to_applicant` up to the current step. Never files or the email in the portal.
- **Mediator** — every field, always. Information often arrives by phone or WhatsApp, and corrections after a pre-inspection are made here.

There is no field ownership and no locking. Every write goes through one action, `CaseFileService::update()`, which validates the values against their definitions and sets the review status. *Planned:* it also records the change in the audit trail, and the mediator is notified when the applicant changes something after the application was submitted.

### Review

For `requires_review` fields, a value only counts as present once a mediator has **confirmed** it.

- A value the **mediator** enters or saves is confirmed implicitly.
- A value the **applicant** enters or changes is `pending` (*Prüfung offen*). Saving it unchanged keeps its review.
- A value **taken over** from an earlier adoption has to be reviewed again.

*Planned:* explicit **confirm** and **reject with a note** actions on a pending value.

> **Example — Sicherheitsgeschirr.** The applicant uploads a photo of an ordinary collar. The mediator rejects it with "Das ist ein Halsband, bitte ein Sicherheitsgeschirr mit Bauchgurt fotografieren." The portal shows the note and asks for a new photo. The new upload sets the status back to `pending`; the mediator confirms. The old photo stays in the audit trail.

Rejecting a value will send the applicant **one email per rejection**: the field's label, the mediator's note and a portal link — never the value itself, since personal data doesn't belong in an email.

### Replacing files *(planned)*

Replacing a file never deletes the old one. It is detached from the current value and stays reachable from the audit trail. Otherwise a replaced landlord confirmation with different wording could not be told apart from the original. Permanent removal (a mediator cleanup action, GDPR erasure) is planned separately and not part of this design.

---

## Requirement Overrides

The catalogue sets defaults. The mediator decides per adoption, from the field's menu on the *Angaben* tab (*Anforderung*):

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

Overrides are internal: the applicant sees their effect on what is required, never the override itself. *Planned:* making a field required for a step that has already been requested sends it to the applicant immediately (email + portal).

**Effective requirement** for a field on an adoption, in order of precedence:

1. The adoption's override, if any.
2. Otherwise the stricter (earlier) of the definition's `required_for` and the contract templates offered for the animal's type: every field an active template marks as *required* is required for `contract` (see [ADR-017](../ADRs/ADR-017-contract-templates-as-configuration.md#prototype-notes)).

Fields that don't apply — a [condition](#conditional-fields) that isn't met — are never required.

---

## Requesting data — split collection

> **Planned.** Today the portal derives the step from the adoption's progress — the **current step**, the first step that isn't finished (see [applicant-portal.md](./applicant-portal.md#which-fields-the-current-step)). The design below replaces that with a step the mediator controls.

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

The Checklist answers one question: **what is still missing for step X?** The rules live in `ChecklistCalculator`, pure logic over plain values (`FieldSpec`, `CaseFileState`), so every rule is unit-testable without a database. `CaseFileService::checklist($adoption, $step)` feeds it an adoption's data.

```
items = every field effectively required for $step (or an earlier step)
        that applies (animal type + condition)
status per item:
  missing          no value (or a rejected value)
  awaiting review  requires_review and not confirmed yet
  done             value present (and confirmed, if review is required)
```

It covers Case File fields, the applicant's built-in fields, and — through the contract templates of the animal's type — the animal and mediator fields that the contract requires.

Where it is used:

- **Adoption page** — the summary on the overview, e.g. *"Für den Vertrag fehlen 2 Angaben, 1 Prüfung offen"*, with links where missing animal or mediator data has to be fixed.
- **Contract generation** — blocked while a field the chosen template requires is missing (waived items don't count).
- **Transport page** — aggregates the transport checklist over all assigned adoptions: *"Tour Süd: 3 von 8 Adoptionen vollständig"* with the missing items per adoption. See [transport.md](./transport.md#checklist).
- **Portal and application form** — the open items among the fields the applicant can see, and every missing field at once when an application is submitted.

Other steps are not blocked by the checklist; the mediator decides.

---

## How the Case File appears

### Mediator — adoption page

The adoption page has three tabs: **Übersicht**, **Angaben**, **Verlauf**. The adoption only shows and edits information; how fields are configured lives in the settings.

- **Übersicht**: the steps, plus a compact **Checkliste** per step that opens on the first incomplete one. Below it the applicant's earlier adoptions (*Frühere Vermittlungen*).
- **Angaben**: every group in catalogue order, with a group menu and a filter **"Nur offene"**. Each group is edited as a whole in a dialog, where conditional fields appear and disappear while typing.
- Each field shows its value first; badges only flag what needs attention (*Fehlt*, *Prüfung offen*, *Für diese Vermittlung angepasst*), and the requirement is a short grey note.
- Per field: require, waive or move the due step (Requirement Override).
- **Verlauf**: empty until the audit trail exists.

*Planned* on the adoption page:

- The last change per field (*"vom Bewerber geändert am 12.11."*) linked to the audit trail.
- Fields that apply but haven't been requested yet shown greyed: *"noch nicht angefragt"*.
- A filter **only for step X**.
- A **marker for applicant changes** — see below.

#### Change notifications

*Planned.* A marker on the adoption: *"3 Änderungen durch Bewerber seit 12.11."* with a jump to the audit trail and a **"Gesehen"** button. Changes to fields printed in an already generated contract are highlighted.

The marker is **per adoption, not per user**: `adoptions.applicant_changes_seen_at`. Every applicant change after the application was submitted counts until someone clicks "Gesehen". Since each adoption has one responsible mediator, one user's "Gesehen" clearing it for everyone is accepted.

- The adoption list shows a badge and offers the filter *"Ungesehene Änderungen"*.
- The **assigned mediator** gets a **daily summary email** of unseen changes (applicants often change several fields in a row, so not one email per change). Without an assigned mediator there is only the badge. The summary runs through the scheduler, like the contract signing reminders.

### Applicant — application form and portal

- The **application form** shows every group with fields asked at `application` on one page, each group as a card with its intro and Info Blocks. See [adoption.md](./adoption.md#application).
- The **portal** shows the same groups, editable, for the fields up to the current step, with the open items at the top. See [applicant-portal.md](./applicant-portal.md).
- Fields marked with a condition appear and disappear while the applicant types.
- *Planned:* request forms for a requested step, containing only the missing fields.

### Inspector — pre-inspection page

The same groups, read-only, limited to fields with `visible_to_inspector` that apply. Contract data like the Ausweisnummer stays hidden. See [pre-inspection.md](./pre-inspection.md).

---

## Second adoption by the same applicant

Values belong to the adoption — a snapshot of what was true for that decision — including the applicant's name, email and address ([ADR-018](../ADRs/ADR-018-applicant-data-on-the-adoption.md)). Adoptions of the same applicant are those with the same email or the same referenced Person. Reuse is explicit:

- **Cross-reference** — the adoption overview lists the applicant's other adoptions (*Frühere Vermittlungen*, with why they match: same email, same Person) and their pre-inspections (read-only), e.g. *"Bereits eine Vorkontrolle für Bello (Hund) am 03.04., Ergebnis: geeignet"*.
- **Taking over** — *"Angaben übernehmen"* on one of those adoptions. Everything that is empty here is filled from it, matched by field key, so a field the other animal type's catalogue also has is taken over too. Nothing is overwritten. Taken-over values of `requires_review` fields have to be reviewed again — a landlord confirmation from half a year ago gets reviewed, not trusted blindly. The result lists the fields that were filled.

*Planned:*

- Picking the values to take over instead of all empty ones.
- Files are copied (Spatie `copyMedia`); the duplicates are an accepted cost.
- The applicant takes over data in the portal.
- Every taken-over value is recorded in the audit trail as an import.

---

## Not supported (deliberately)

- **Complex conditions** — AND/OR, comparisons, conditions across adoptions. One equality condition per field only.
- **Filtering or sorting the adoption list by custom field values.** The built-in applicant fields are columns and can be searched and sorted.
- **Per-audience layouts.** One structure, filtered per audience.
- **Locking fields** after contract generation. The change notification warns instead; see [ADR-016](../ADRs/ADR-016-adoption-case-file.md#lock-fields-once-they-are-in-a-generated-contract).
