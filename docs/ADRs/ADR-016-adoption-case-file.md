# ADR-016: Adoption Case File — Configurable Fields Stored on the Adoption

## Status

Accepted

## Context

Taily has three core models: Animal, Person and Adoption. Until now the idea was that everything known about an applicant lives on the **Person**: identity columns (name, email, address, phone, date of birth) plus, eventually, custom fields — the same way pre-inspections are attached to the Person and an Animal Type rather than to an Adoption. A second adoption by the same person would then simply show everything already gathered.

In practice the Person only holds identity data today. The only structured applicant data is the pre-inspection `FormSubmission`, built with the [form builder](../features/form-templates.md). There is no public application flow yet. So most of what follows is new functionality, not a migration of existing data.

A set of features is known to be needed sooner or later, and none of them fit a "data lives on the person" model well:

| Feature | Example |
|---|---|
| **Custom fields** the adopter has to provide | "Wie viele Stunden am Tag wäre der Hund allein?" |
| **Requirements per step** | The Ausweisnummer does not have to be given at application, but must be present before the contract is generated. |
| **Split collection** | The application only asks what is needed to decide whether the applicant is a good fit. Contract or transport data is asked later, only when it is actually needed. This lowers the hurdle of applying while still getting all required information. |
| **Applicant portal** | The applicant sees the whole process from application to handover, sees what they sent in and can add or change it. |
| **Corrections from the pre-inspection** | The applicant said 200 m², the inspector found it is 120 m² once the attic is not counted. The data has to be updated accordingly. |
| **Mediator review** | The adopter needs a Sicherheitsgeschirr before transport. Many confuse it with a normal collar, so they have to upload a photo and the mediator confirms it is the right thing. |
| **Documents and videos** | A short video of the home with or right after the application — an alternative to a pre-inspection when an appointment is hard to find, or when something seems off. A landlord's confirmation that animals are allowed. Whether either is needed is decided case by case by the mediator. |
| **Checklists** | Show what is missing for a planned transport instead of checking every animal and person by hand. |

What these have in common: the data belongs to **one specific adoption**. Whether the data is sufficient depends on the animal (a Chihuahua has different requirements than a Husky) and on how far this particular adoption has progressed. The pre-inspection, being attached to Person + Animal Type, already shows this mismatch: it cannot see which animal it is about.

Two fears shaped the decision:

1. **Complexity** — is this far too complicated compared to what exists?
2. **Reuse** — Taily is meant to be used by organizations with simpler or more complicated processes than ours. Heavy customization could make it hard to reuse.

## Decision

**The data relevant to *if and how* an adoption happens is stored on the Adoption, in a Case File made of configurable Field Definitions — including the applicant's identity. Organizations configure *which* fields exist and *by when* each is needed; the process itself (its steps) stays in code.**

### 1. The boundary: configure fields, not the process

The steps of an adoption are a fixed set, owned by code: `application`, `pre_inspection`, `contract`, `transport`, `handover`. Organizations cannot add, remove or reorder steps, and there is no workflow engine.

What organizations configure is the **field catalogue**: which fields exist, how they are grouped and presented, at which step they are first asked and by which step they are required.

This is the answer to the reuse fear. An organization with a simple process configures five fields, all asked and required at application. One with a thorough process configures forty fields spread across the steps, with photo reviews and contract-only data. Neither configures the process, because there is nothing to configure.

### 2. The applicant's identity is part of the Case File

The applicant's name, email, phone, date of birth and address are stored on the adoption in fixed columns and exposed as **built-in Field Definitions** in every catalogue, so the same requirement rules apply to them — e.g. "the address is only required by the contract", which lets the application form ask for nothing but name and email. Adoptions of the same applicant are linked by the confirmed email; a Person Taily already manages can be referenced, but is never the source of the data. The details are in [ADR-018](ADR-018-applicant-data-on-the-adoption.md).

### 3. Field Definitions, Field Groups and Field Values

- **Every animal type has its own catalogue** of groups and fields, configured in the settings. What is configured on *Hund* is exactly what a dog adoption asks. A shared catalogue with per-type switches was considered and rejected: editing a shared field on one animal type would silently change it for the others. Duplication is kept cheap by copying a catalogue from another animal type.
- A **Field Definition** describes one field: key (unique per animal type), label, type, options, `collect_at`, `required_for`, `requires_review`, `visible_to_applicant`, `visible_to_inspector`, condition.
- A **Field Group** is a titled section with optional intro text. Fields and Info Blocks are ordered inside groups. Groups decide *where* a field appears; `collect_at`/`required_for` decide *when*.
- A **Field Value** is one row per adoption and field, holding the current value (and files, via Spatie media) and a review status.

Details and examples are in [features/case-file.md](../features/case-file.md).

### 4. Requirements are derived, with per-adoption overrides

`required_for` on the definition is the organization's default. A mediator can override it per adoption — require the home video for this applicant, waive the landlord confirmation for someone who owns their house. The contract templates of the animal's type also add the fields they print (see [ADR-017](ADR-017-contract-templates-as-configuration.md)).

The **Checklist** is the single derived answer to "what is missing for step X?". It works per adoption and is aggregated per transport.

### 5. The mediator has full edit rights; the audit trail makes that safe

Every role that may write a value can write it: the applicant (application form, portal) and the mediator (admin, including information received by phone or WhatsApp). There is no field ownership and no locking.

Safety comes from an **audit trail**: every change records who changed what, when, from which value to which value. Replaced files are kept. The mediator is notified when the applicant changes something after the fact. See [features/audit-trail.md](../features/audit-trail.md).

### 6. Pre-inspections move to the adoption and no longer use a form template

A Pre-Inspection belongs to an Adoption, so it knows the animal. The inspector sees the animal and the Case File fields marked `visible_to_inspector`, and writes a verdict and a free-text memo. A mismatch ("the 200 m² include an attic that isn't usable") goes into the memo; the mediator corrects the value afterwards. See [features/pre-inspection.md](../features/pre-inspection.md).

The pre-inspection form template and its submissions are removed. Taily is in beta, so existing data is not preserved.

**The form builder itself is not removed yet.** Animals need custom fields too — marketing fields for the website, notes about the animal — fully customizable by the organization. Whether that is built with the existing form builder or by extending the Field Definition catalogue to animals is an open decision; see [form-templates.md](../features/form-templates.md#future-of-the-form-builder).

### 7. A second adoption copies, it does not share

Values belong to the adoption — a snapshot of what was true for *this* decision. For the (rare) case of a person applying again:

- **Cross-reference**: the adoption page shows the applicant's earlier adoptions and pre-inspections, read-only — found by email or a referenced Person ([ADR-018](ADR-018-applicant-data-on-the-adoption.md)).
- **Import**: the mediator (admin) or the applicant (portal) can copy selected values from an earlier adoption. Files are copied as well. Duplicated files are an accepted cost of each adoption standing on its own.

## Consequences

### Positive

- Every feature in the table above becomes a view over the same few tables instead of its own mechanism: forms are generated from the catalogue, the checklist is derived, the portal is a read/write view, contract requirements are derived from the template.
- Requirements can depend on the animal, because the data sits next to the animal.
- The reuse surface is small and predictable: fields, groups, two step settings and three flags.
- The application form can be short, which lowers the barrier to apply.

### Negative

- A person applying a second time does not automatically see their earlier data; it has to be imported. Accepted, because it is an edge case and the import keeps it a one-click action.
- Field values are stored per row with a JSON value (EAV-style). Filtering and sorting the adoption list by custom field values does not fit the [list-view pattern](../coding-patterns/list-views.md) cleanly; it is not supported until there is a concrete need.
- Imported files are duplicated on disk.
- Conditional fields are limited to one condition per field (see [case-file.md](../features/case-file.md#conditional-fields)). No AND/OR logic.
- Changing a field's type is not supported. A field with a different meaning or type gets a new key; the old one is archived. This replaces form-template versioning with a simpler rule.

## Alternatives Considered

### Keep custom fields on the Person

The original idea. A second adoption would show everything already known. Rejected because requirements depend on the animal and on the adoption's progress, the checklist and portal are per adoption, and the inspection result is about a specific animal. Reuse across adoptions is covered by import and cross-referencing instead.

### Field ownership with inspector verifications

Each field would have one owner (applicant, inspector or mediator); other roles would add a verification (confirmed / disputed + corrected value) instead of editing. The effective value would be the correction if present. This prevents the applicant from overwriting an inspector's correction.

Rejected as too heavy for how pre-inspections actually work: the inspector writing about a mismatch in a memo and the mediator correcting the value is enough. The mediator needs full edit rights anyway, because information also arrives by phone or WhatsApp. The audit trail makes an overwrite visible and the mediator is notified about it.

### Lock fields once they are in a generated contract

Would prevent the applicant from changing data that is already written into the contract. Rejected as a mechanism: the generated PDF is frozen anyway, so a later change cannot alter the contract, and the audit trail records it. Instead the change notification carries a warning when a changed field is part of a generated contract. This needs no per-field option, because the template already declares its fields.

### Configurable process steps

Letting organizations define their own steps would cover more exotic processes, but it turns Taily into a workflow engine and makes every feature (checklist, portal, contract gating) depend on a user-defined graph. Rejected; the fixed steps are already optional and can be skipped.

### Keep a form template for pre-inspections

The inspector's job is to check what the applicant sent in, not to collect a second data set. Organizations whose inspectors do collect information can configure fields that are hidden from the applicant (`visible_to_applicant = false`) and that the mediator fills from the memo. Letting the inspector write those fields directly is a possible later extension (an `editable_by_inspector` flag on the same definitions), not a reason to keep a separate form for pre-inspections.
