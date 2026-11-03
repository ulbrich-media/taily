# ADR-017: Applicant Data on the Adoption

## Status

Proposed — supersedes section 2 ("Person = identity") of [ADR-015](ADR-015-adoption-case-file.md) and refines its section 7 ("A second adoption copies, it does not share")

## Context

[ADR-015](ADR-015-adoption-case-file.md) moved everything about *if and how* an adoption happens onto the adoption, but kept the applicant's identity — name, email, phone, date of birth, address — on a shared **Person**. Built-in Field Definitions read and wrote those Person columns live.

That left the Case File with two kinds of data that behave differently:

- **No history per adoption.** Correcting an address in one adoption changes it in every adoption of that person, including closed ones. Last year's adoption shows today's address.
- **A Person must exist before data can be stored.** An unconfirmed public application has no applicant yet, so its identity data needed a separate pending payload.
- **Everything about the adopter is spread across two models**: lists, search and sorting join the Person; the contract, the portal and the checklist read both.
- **Deleting old data** is harder: a Person shared by several adoptions — and referenced by contract signers with `restrictOnDelete` — can't be removed when one adoption is old enough to be deleted.

What a Person actually gives the adopter side is small: seeing earlier adoptions, reusing their data, warnings ("not again"), and the portal finding "your adoptions". None of these needs shared, live identity data. Mediators, inspectors and foster carers are different: they are managed in Taily with roles, animal types and accounts, and stay Persons.

## Decision

**An adoption holds its applicant's data itself, in fixed columns. The confirmed email address links adoptions of the same applicant. An optional reference to a Person exists for people Taily already manages, but it is never a data source.**

### 1. Fixed applicant columns

```
adoptions
  applicant_first_name, applicant_last_name
  applicant_email            indexed (not unique), stored trimmed and lowercased
  applicant_phone, applicant_mobile
  applicant_date_of_birth    nullable
  applicant_street_line, applicant_street_line_additional,
  applicant_postal_code, applicant_city, applicant_country_code
```

A field is a fixed column — not a Field Value — when Taily's code does something with it beyond showing it: the full name for lists, mails and the contract; the email for linking, the portal and notifications; the address for the contract and searching.

They stay **built-in Field Definitions** of every catalogue, so labels, groups, steps and visibility are configured exactly like before. Only the target changes: the definition's `applicant_attribute` (formerly `person_attribute`) names the adoption column. All other Case File fields stay flexible Field Values.

The values are the adoption's own: a correction applies to this adoption only. An unconfirmed public application stores its data directly on the adoption; no pending payload is needed.

### 2. The email is the soft link

Adoptions with the same applicant email belong to the same applicant. Public applications are confirmed by double opt-in, so the email is verified. The link is derived, never stored:

- **Earlier adoptions**: the adoption page lists the other adoptions with the same email or the same linked Person — status, animal, dates, and their pre-inspections.
- **Taking over data**: the mediator copies values from one of those adoptions into the current one. Only empty fields are filled; nothing is overwritten.
- **Portal**: the magic link goes to an email and shows every adoption with that email.

An adoption entered by hand without an email has no link and no portal access until an email is added. A changed email breaks the link to earlier adoptions; the audit trail keeps the old one, and the Person reference covers people Taily knows.

A shared mailbox (a couple using one address) counts as one applicant. That is accepted.

### 3. Optional Person reference

```
adoptions.applicant_person_id   nullable, nullOnDelete — reference only
```

For applicants Taily already manages — a foster carer adopting their foster animal, an inspector, a team member — and later for following an animal's whereabouts across foster and adoption.

- When an adoption is **created from an existing Person**, that Person's data is **copied once** into the applicant columns and the reference is set.
- The mediator can **link or unlink** a Person later. That sets only the reference; nothing is copied or synchronised.
- Afterwards the adoption and the Person are independent; changing one never changes the other.

### 4. Contract signers keep their own name and email

Each `contract_signers` row stores the `name` and `email` valid when that signer is invited — the mediator when the process starts, the adopter once the mediator has signed. Invitations, reminders, the signing page, the signature appendix and audit events use them. `person_id` becomes an optional reference (set for the mediator; for the adopter only when the adoption references a Person) and is nulled when the Person is deleted.

What was signed, by whom and at which address stays fixed — like the frozen PDF. A corrected email during a running process is a deliberate step (cancel and restart), not a silent switch.

### 5. Applicant notes per email (later)

A small record keyed by email — *Nicht vermitteln*, *Bekannt/zuverlässig*, *Hinweis* — shown as a banner on every adoption with that email. It is only built once warnings are needed; until then a note on the earlier adoption, visible in the list of earlier adoptions, does the job.

## Consequences

### Positive

- Each adoption is self-contained: its applicant data is what was true for *this* adoption, and contract data, checklist and audit trail work on one source.
- Unconfirmed applications need no special storage.
- Lists, search and sorting work on plain indexed columns.
- Deleting old adoptions deletes their personal data; nothing shared stands in the way.
- Signature records no longer depend on data that can change or be deleted.

### Negative

- Earlier adoptions are found by email; a changed email loses them unless a Person is referenced.
- Correcting an address for several running adoptions of one applicant means correcting each.
- An adopter who is also a foster carer or inspector is only connected through the optional reference or the same email.
- The unique-email-per-Person rule from ADR-015 is dropped; Persons keep their email, but adopters are no longer Persons.

## Alternatives Considered

### Keep the applicant as a Person (ADR-015)

Shared identity, live values. Rejected for the reasons in *Context*: no history, a Person required before data, and harder deletion.

### Store applicant data as ordinary Field Values

Fully flexible, but name, email and address would sit in JSON: no index for linking by email, no plain sorting or searching, and every consumer would need to know the keys. Rejected; these fields are part of what Taily's code relies on.

### A stored "applicant" record grouping adoptions

An explicit entity linking adoptions instead of the derived email match. It brings back a shared object to maintain and merge. Rejected for now; the optional Person reference covers the cases where a firm link matters.
