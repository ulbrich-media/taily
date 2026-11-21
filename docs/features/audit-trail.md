# Audit Trail

> **Status: planned, not implemented. The implementation approach is still being researched** (see [Open research](#open-research)).

The audit trail records **who changed what, when, from which value to which value** for animals, people and adoptions, including the [Case File](./case-file.md).

It is what makes full edit rights safe. The mediator can edit everything, and so can the applicant for their own data through the [portal](./applicant-portal.md), instead of fields being owned and locked per role (see [ADR-016](../ADRs/ADR-016-adoption-case-file.md#5-the-mediator-has-full-edit-rights-the-audit-trail-makes-that-safe)). An overwrite cannot be prevented, but it can always be traced and is never silent.

## Why it is needed

- **Corrections stay traceable.** The applicant claimed 200 m², the inspector's memo says 120 m², the mediator corrects it. If the applicant later sets it back to 200, the trail shows the full sequence, and the mediator is notified.
- **Documents can be proven.** If an applicant replaces their landlord confirmation with a version that has different wording and claims it was always like that, the original file is still there. This is why replaced files are kept.
- **Wrong data stays visible.** If the wrong person's Ausweisnummer is entered and then corrected, the old value remains in the trail. That is acceptable, and the reason a cleanup function is planned later.
- **Contract wording is legal text.** Changes to [contract templates](../ADRs/ADR-017-contract-templates-as-configuration.md) are recorded.

## Requirements

| Requirement | Detail |
|---|---|
| **Subjects** | Animal, Person, Adoption, Field Values, Requirement Overrides, Pre-Inspections, Contract Templates. Configuration (Field Definitions, Groups) is a nice-to-have. |
| **Content** | Subject, attribute/field, old value, new value, timestamp |
| **Actor** | One of: an authenticated `User`; the applicant acting through a token (no user account); an inspector through a token; the system (e.g. an import). Token actors are recorded with the Person they act for. |
| **Origin** | IP and user agent for token actors, the same as the contract signing events record |
| **Files** | Adding, replacing and removing a file is recorded, and replaced files are **kept** and reachable from the entry |
| **Relations** | Changes to pivot relations (e.g. animal types of a role) are recorded |
| **Display** | A readable history per record in the admin UI ("Wohnfläche: 200 → 120, von Anna Schmidt (Vermittlerin) am 14.11.2026, 10:32"), with labels taken from the Field Definitions |
| **Notifications** | The trail can drive "changed by the applicant since your last visit", with an extra warning when the changed field is part of a generated contract |

### Out of scope for now

- **Permanent removal** — a mediator cleanup action to erase a value and its history (e.g. a wrongly entered ID number).
- **GDPR erasure and retention** — a later feature package. It will have to treat the audit trail and kept files like any other personal data.

Both are far in the future but should not be made impossible: entries and kept files must be deletable by subject.

## Relation to the contract signing audit trail

`ContractSigningAuditEvent` ([contract.md](./contract.md#audit-trail)) stays separate. It is an evidentiary log with a fixed event vocabulary, printed into the signed PDF, and it snapshots signer identities. The general audit trail is an operational change history. They answer different questions and have different retention needs, so they are not merged.

## Open research

Laravel has no built-in auditing; it offers Eloquent model events and observers, which every option builds on. To evaluate:

| Option | Notes |
|---|---|
| `spatie/laravel-activitylog` | Most widely used. A `LogsActivity` trait logs model changes with a causer and old/new attributes in `properties`. Also handles manual "activity" entries. Fits the existing Spatie stack (media library). |
| `owen-it/laravel-auditing` | Purpose-built for auditing: `old_values`/`new_values`, IP, user agent and URL out of the box, custom user resolvers (useful for token actors), pivot auditing helpers. |
| Own implementation | A table plus an observer/trait. Full control over token actors and file handling, but rebuilds known functionality. |

Points to check for every option:

- **Bypassed events** — mass updates (`Model::query()->update()`), `insert()` and raw queries do not fire model events. Writes to audited models must go through models, or be logged explicitly.
- **Pivots** — `sync()`/`attach()` fire no model events by default.
- **Media** — Spatie media changes are separate models; replacements need explicit entries and must not delete the old file.
- **Token actors** — resolving an actor that is a Person acting through an `AccessToken`, not a `User`.
- **JSON values** — Field Values store JSON; the diff has to be readable per field.
- **Volume** — one entry per changed attribute vs. per save; querying a record's history efficiently.

Choosing a package requires approval according to [dependency-approval.md](../agents/dependency-approval.md).
