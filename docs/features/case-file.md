# Case File

The Case File (German UI: *Angaben*) is everything an adoption knows about *if and how* it can happen: the applicant's identity and living situation, their experience, documents, photos, contract data, transport details. It belongs to the **adoption** ([ADR-016](../ADRs/ADR-016-adoption-case-file.md)); the applicant's name, contact and address are part of the adoption itself ([ADR-018](../ADRs/ADR-018-applicant-data-on-the-adoption.md)).

Organizations configure which fields exist and when they are needed. Taily's code owns the process — the fixed steps *Bewerbung*, *Vorkontrolle*, *Vertrag*, *Transport*, *Übergabe* (see [adoption.md](./adoption.md)). That split is the core idea: **configure fields, not the process.**

## Concepts at a glance

| Concept | German UI | What it is |
|---|---|---|
| **Field Definition** | Feld | One configurable field: type, label, when it is asked, when it is required, who sees it |
| **Built-in Field** | Standardfeld | A field for the applicant's identity and contact (name, email, address, …). Configurable, not deletable |
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

A field has these settings:

| Setting | Meaning |
|---|---|
| Key | Stable identifier, unique per animal type, never changes: `living_space_sqm` |
| Label, help | The German text shown with the field |
| Type | See below |
| Options | Choices of a select or radio field |
| Group, position | Where it is shown |
| Asked from (`collect_at`) | The step at which the field is first asked |
| Required for (`required_for`) | The step from which it is required; empty = optional |
| Needs review (`requires_review`) | A mediator has to confirm the value |
| Visible to the applicant | Asked in the application form, shown and editable in the portal |
| Visible to the inspector | Shown on the pre-inspection page |
| Condition | Only applies if another field has a given value |

### Types

`text`, `textarea`, `number`, `integer`, `boolean`, `select`, `radio`, `date`, `email`, `phone`, `photo`, `video`, `document`, and the layout type `info` (an Info Block).

File types (`photo`, `video`, `document`) can be configured and required, but nobody can upload to them yet: the applicant sends files to the mediator directly, and the application doesn't block on a required file.

### Built-in fields

Every catalogue contains the applicant's built-in fields: first name, last name, email, phone, date of birth and address (street, additional line, postal code, city, country as one field). Their group, position, steps and visibility are configurable like any other field; they cannot be archived, and their type is fixed. Name and email are always collected at application, because they identify the applicant. There is one phone field, for a mobile or a landline number.

Their values are stored on the adoption, not as Field Values, because Taily relies on them: the full name in lists, mails and the contract; the email for linking adoptions and the portal; the address for the contract and searching. A correction applies to this adoption only — never to another adoption or a Person. The email is stored trimmed and lowercased.

### When a field is asked and required

Steps have a nominal order: *Bewerbung* → *Vorkontrolle* → *Vertrag* → *Transport* → *Übergabe*. The order is only used for data requirements; the steps themselves stay optional and may happen in any order.

- **Asked from** — the first step whose form asks for the field.
- **Required for** — the first step that needs it; it stays required for every later step. Must not be earlier than *asked from*. Empty means optional.

Two settings are needed because "asked" and "needed" are often different:

| Field | Asked from | Required for | Why |
|---|---|---|---|
| Name, email | application | application | Identifies the applicant |
| Wohnfläche (m²) | application | application | Part of deciding whether it fits |
| Anschrift | application | contract | Usually given right away, but only needed for the contract |
| Hausvideo | application | — | Offered at application; the mediator requires it case by case |
| Vermieterbestätigung | pre_inspection | — | Only relevant for tenants; required per adoption |
| Ausweisnummer | contract | contract | Not asked before it is needed |
| Foto Sicherheitsgeschirr | transport | transport | Asked once the transport is planned, reviewed by the mediator |

The application form and the portal show the difference to the applicant: a field required now is marked *Pflicht*, one asked early but needed later *Nötig für: Vertrag*.

### Changing a definition

Labels, help, group, position, steps and flags can always be changed. The **type and key cannot**: a field whose meaning or type changes gets a new key and the old one is archived. Archived fields keep their existing values and stay visible on old adoptions, but are no longer asked.

**Changes apply live to all active adoptions** (unconfirmed, pending, in progress). Requirements are derived, never snapshotted per adoption, so a new required application field immediately shows up as missing on every running adoption — and as an open item in the portal of applicants whose current step already covers it. No emails are sent; the mediator sees it on the checklist and asks for it or waives it. Done and canceled adoptions have no checklist and keep their values. Archiving a field removes it from every checklist.

---

## Field Groups and Info Blocks — structuring 30+ fields

An application alone can have 30 fields, plus more for pre-inspection, contract and transport. Two independent axes keep that manageable:

- **Groups decide *where*** a field is shown — the same for every audience and every step.
- **Steps decide *when*** a field is shown.

Every form and view is "all groups, in order, filtered to the fields relevant here"; **groups that end up empty are hidden.** An organization structures its fields once, and every form follows from it. A group has a title, an optional intro text and a position.

Info Blocks are entries inside a group, ordered like fields. They are shown wherever their group is shown, and their *asked from* step controls from which step on they appear.

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
  Vermieterbestätigung                        document · pre_inspection · optional, required per adoption · review
  Hausvideo                                   video    · application · optional, required per adoption

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
Größe des Gartens       only if  Garten vorhanden = ja
Vermieter einverstanden only if  Wohnform is one of: Wohnung
```

Deliberately limited:

- **One condition per field**: equality or membership on a `boolean`, `select` or `radio` field.
- **The controlling field must come earlier** in the catalogue order. That rules out cycles and keeps forms readable top to bottom. Chains are allowed (C depends on B depends on A); a field whose controlling field doesn't apply doesn't apply either.
- No AND/OR, no number comparisons.

A field whose condition is not met **doesn't apply**. It is not asked, not shown, not required and not on the checklist. Its value is kept if it was filled in earlier, but it is not displayed or printed while the condition is not met. A Requirement Override cannot make a non-applying field required.

Forms show and hide conditional fields while the user types — the mediator's group dialog, the application form and the portal — with the same rules the server applies.

## Field Values

One value per adoption and field holds the **current** value, with its review status.

Who can write:

- **Applicant** — through the application form and the [portal](./applicant-portal.md), for fields visible to applicants up to the current step. Never files, and never the email in the portal.
- **Mediator** — every field, always. Information often arrives by phone or WhatsApp, and corrections after a pre-inspection are made here.

There is no field ownership and no locking. Every write, from any of these places, is validated against the field's definition and sets the review status.

### Review

For fields that need review, a value only counts as present once a mediator has confirmed it.

- A value the **mediator** enters or saves is confirmed implicitly.
- A value the **applicant** enters or changes is *Prüfung offen*. Saving it unchanged keeps its review.
- A value **taken over** from an earlier adoption has to be reviewed again.

Confirming a pending value therefore means saving it as the mediator. There is no explicit reject yet; the mediator asks the applicant for a correction outside Taily.

---

## Requirement Overrides

The catalogue sets defaults. The mediator decides per adoption, from the field's menu on the *Angaben* tab (*Anforderung*): require the field for a step, make it optional, or waive it for this adoption.

| Situation | Override |
|---|---|
| Finding a pre-inspection appointment is hard → ask for a home video instead | Hausvideo: required for *Vorkontrolle* |
| Something in the application seems off | Hausvideo: required for *Vorkontrolle* |
| Applicant is a tenant | Vermieterbestätigung: required for *Vorkontrolle* |
| Applicant owns the house | Vermieterbestätigung: waived |
| The adopter is known and trusted, e.g. adopting a second time | Foto Sicherheitsgeschirr: waived |

Overrides are internal: the applicant sees their effect on what is required, never the override itself.

**Effective requirement** for a field on an adoption, in order of precedence:

1. The adoption's override, if any.
2. Otherwise the stricter (earlier) of the field's own *required for* and the contract templates of the animal's type: every field an active template marks as *required* is required for the contract (see [contract.md](./contract.md#contract-templates)).

Fields that don't apply — a [condition](#conditional-fields) that isn't met — are never required.

---

## Checklist

The Checklist answers one question: **what is still missing for step X?**

Its items are every field effectively required for that step (or an earlier one) that applies. Each item is:

- **missing** — no value,
- **awaiting review** — needs review and isn't confirmed yet,
- **done** — present (and confirmed, if review is required).

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
- **Verlauf**: empty until the [audit trail](./audit-trail.md) exists.

### Applicant — application form and portal

- The **application form** shows every group with fields asked at application on one page, each group as a card with its intro and Info Blocks. See [adoption.md](./adoption.md#application).
- The **portal** shows the same groups, editable, for the fields up to the current step, with the open items at the top. See [applicant-portal.md](./applicant-portal.md).
- Fields with a condition appear and disappear while the applicant types.

### Inspector — pre-inspection page

The same groups, read-only, limited to fields visible to the inspector that apply. Contract data like the Ausweisnummer stays hidden. See [pre-inspection.md](./pre-inspection.md).

---

## Second adoption by the same applicant

Values belong to the adoption — a snapshot of what was true for that decision — including the applicant's name, email and address. Adoptions of the same applicant are those with the same email or the same referenced Person. Reuse is explicit:

- **Cross-reference** — the adoption overview lists the applicant's other adoptions (*Frühere Vermittlungen*, with why they match: same email, same Person) and their pre-inspections (read-only), e.g. *"Bereits eine Vorkontrolle für Bello (Hund) am 03.04., Ergebnis: geeignet"*.
- **Taking over** — *"Angaben übernehmen"* on one of those adoptions. Everything that is empty here is filled from it, matched by field key, so a field the other animal type's catalogue also has is taken over too. Nothing is overwritten. Taken-over values of fields that need review have to be reviewed again — a landlord confirmation from half a year ago gets reviewed, not trusted blindly. The result lists the fields that were filled.

---

## Not supported (deliberately)

- **Complex conditions** — AND/OR, comparisons, conditions across adoptions. One condition per field only.
- **Filtering or sorting the adoption list by custom field values.** The built-in applicant fields can be searched and sorted.
- **Per-audience layouts.** One structure, filtered per audience.
- **Locking fields** after contract generation. The generated PDF is frozen anyway; see [ADR-016](../ADRs/ADR-016-adoption-case-file.md#lock-fields-once-they-are-in-a-generated-contract).

## Planned

- **File fields** — uploads in the application form, the portal and the admin, with a maximum number of files per field. Replacing a file never deletes the old one; it stays reachable from the audit trail, so a replaced landlord confirmation can be told apart from the original.
- **Review actions** — explicit *confirm* and *reject with a note*. A rejection sends the applicant one email with the field's label, the note and a portal link — never the value itself. The portal shows rejected values at the top: *"Das ist ein Halsband, bitte ein Sicherheitsgeschirr mit Bauchgurt fotografieren."* A new value goes back to *Prüfung offen*.
- **Requesting data** — a step the mediator controls (*requested step*) replaces the portal's derived current step. *"Angaben für den Vertrag anfordern"* emails the applicant a form with exactly the missing fields of that step. Requests are never sent automatically; Taily suggests them at natural points (pre-inspection confirmed, transport assigned), and a field made required by an override is requested immediately. *"Erneut erinnern"* resends open items.
- **Audit trail** — every change recorded with who, when, old and new value; see [audit-trail.md](./audit-trail.md). On the adoption page, the last change per field links to it.
- **Change notifications** — a marker per adoption, *"3 Änderungen durch Bewerber seit 12.11."*, with a *"Gesehen"* button, a list filter *"Ungesehene Änderungen"*, and a daily summary email to the assigned mediator. Changes to a field printed in an already generated contract are highlighted, since the PDF keeps the old value.
- **Taking over selected values** instead of all empty ones, including files, and taking over data in the portal.
- **Adoption page** — fields that apply but haven't been requested yet shown greyed (*"noch nicht angefragt"*), and a filter for one step.
