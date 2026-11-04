# Applicant Portal

> **Status: prototype on branch `prototype/adoption-based-structure`.** Part of the design in [ADR-015](../ADRs/ADR-015-adoption-case-file.md) and [ADR-017](../ADRs/ADR-017-applicant-data-on-the-adoption.md). The portal lives at `/adopter`. Implemented: login by email and magic link (4 h, single-use, consumed by the button), a 2 h session sent as a bearer token, the list of adoptions by email with the status rules below, per adoption the steps, the open items and the applicant's data — editable while the adoption is `pending` or `in_progress`; changed values that need review become pending again; the email itself is read-only.
>
> Prototype simplifications: the fields shown are those up to the **current step** — the first step that isn't finished — instead of a mediator-set `requested_step`; file fields can't be uploaded yet; no import from earlier adoptions in the portal, no audit trail, no mediator notifications, and no link to a pending contract signature.

The applicant portal (German UI: *Mein Bewerbungsstatus*) shows an applicant their adoptions — from application to handover — together with the data they sent in. They can add to it and change it there.

## Access: email plus magic link

Applicants have no account and no password. **Whoever controls the mailbox is the person** — the same trust the contract signing emails already rely on. The portal shows every adoption whose applicant email matches ([ADR-017](../ADRs/ADR-017-applicant-data-on-the-adoption.md)), so logging in is simple:

1. The applicant enters their email. The page always answers *"Falls es Bewerbungen zu dieser Adresse gibt, haben wir dir einen Link geschickt."* — whether or not the address exists (no account enumeration).
2. The emailed **magic link is valid for 4 hours and single-use**.
3. The link opens a page with a **"Zum Portal"** button; only the click consumes the token. Email security scanners (e.g. Outlook Safe Links) open links automatically, and would otherwise use up a single-use link before the person ever sees it. The application's email confirmation works the same way.
4. The click opens a **portal session of 2 hours**. There is no "stay logged in".

The links in Taily's own emails (data requests, rejections) are magic links with the same rules; when one has expired, the applicant requests a new one with their email. Login and links are rate-limited per email and per IP, like the signing and pre-inspection routes.

Emails entered by a mediator are trusted without confirmation. A typo sends the link to a stranger — the same accepted risk as for the contract signing emails.

## Which adoptions are shown

| Status | In the portal |
|---|---|
| `unconfirmed` | Not shown — confirming *is* the first login |
| `pending`, `in_progress` | Readable and editable |
| `done` | Read-only: animal, steps, data, download of the signed contract |
| `canceled` | Only *"Bewerbung für Bello – beendet"*: no data and **no cancellation reason**, which is an internal note |

## What the applicant sees

1. **Open requests** at the top — fields that are missing for the requested step, and rejected values with the mediator's note. *"Bitte lade ein Foto des Sicherheitsgeschirrs hoch – das Foto zeigt ein Halsband."*
2. **Process overview** — per adoption, the steps with a simple status each: application received, pre-inspection (planned / done), contract (ready to sign / signed), transport (planned for 23.11.), handover. Steps the mediator skipped are not shown. Internal details (inspector verdict and memo, mediator notes) are never shown.
3. **Their data** — every field with `visible_to_applicant` and `collect_at` up to the adoption's `requested_step`, in the catalogue's groups, read-only with an edit action per group. See [case-file.md](./case-file.md#how-the-case-file-appears).
4. **Import** — on a second adoption, *"Angaben aus früherer Bewerbung übernehmen"* for selected values (see [case-file.md](./case-file.md#second-adoption-by-the-same-person)).

## Editing

The applicant can change the data of their active adoptions at any time. Every change:

- is recorded in the [audit trail](./audit-trail.md) with the applicant as the actor,
- resets a reviewed value to `pending`,
- notifies the mediator ("changes since your last visit"). If the changed field is part of an already generated contract, the notification says so explicitly.

There is no locking. A mediator's correction can be changed back by the applicant; the trail and the notification make that visible.

## Relation to other token pages

The contract signing pages stay separate links with their own single-use, expiring tokens ([contract.md](./contract.md#access-and-security)), because their evidentiary requirements differ. The portal links to them when a signature is pending.
