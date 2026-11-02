# Applicant Portal

> **Status: planned, not implemented.** Part of the design in [ADR-015](../ADRs/ADR-015-adoption-case-file.md).

The applicant portal (German UI: *Mein Bewerbungsstatus*) shows an applicant their adoption — from application to handover — together with the data they sent in. They can add to it and change it there.

## Access

Applicants have no Taily account. The portal is reached through a token link on the adoption, using the `HasAccessToken` pattern ([tokens.md](../coding-patterns/tokens.md)), with the same hardening as the contract signing links: hashed lookup, rate limiting, generic error responses. The link is sent with the application confirmation and with every data request.

The portal lives for the whole adoption. It is not single-use.

## What the applicant sees

1. **Open requests** at the top — fields that are missing for the requested step, and rejected values with the mediator's note. *"Bitte lade ein Foto des Sicherheitsgeschirrs hoch – das Foto zeigt ein Halsband."*
2. **Process overview** — the steps with a simple status each: application received, pre-inspection (planned / done), contract (ready to sign / signed), transport (planned for 23.11.), handover. Steps the mediator skipped are not shown. Internal details (inspector verdict and memo, mediator notes) are never shown.
3. **Their data** — every field with `visible_to_applicant` and `collect_at` up to the adoption's `requested_step`, in the catalogue's groups, read-only with an edit action per group. See [case-file.md](./case-file.md#how-the-case-file-appears).
4. **Import** — on a second adoption, *"Angaben aus früherer Bewerbung übernehmen"* for selected values (see [case-file.md](./case-file.md#second-adoption-by-the-same-person)).

## Editing

The applicant can change their data at any time. Every change:

- is recorded in the [audit trail](./audit-trail.md) with the applicant as the actor,
- resets a reviewed value to `pending`,
- notifies the mediator ("changes since your last visit"). If the changed field is part of an already generated contract, the notification says so explicitly.

There is no locking. A mediator's correction can be changed back by the applicant; the trail and the notification make that visible.

## Relation to other token pages

The contract signing pages stay separate links with their own single-use, expiring tokens ([contract.md](./contract.md#access-and-security)), because their evidentiary requirements differ. The portal links to them when a signature is pending.
