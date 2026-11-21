# Applicant Portal

The applicant portal (German UI: *Meine Bewerbungen*, at `/adopter`) shows an applicant their adoptions — from application to handover — together with the data they sent in. They can add to it and change it there.

It is part of the design in [ADR-016](../ADRs/ADR-016-adoption-case-file.md) and [ADR-018](../ADRs/ADR-018-applicant-data-on-the-adoption.md). The [public application](./adoption.md#application) is its entry point: confirming an application is the first login.

## Access: email plus magic link

Applicants have no account and no password. **Whoever controls the mailbox is the applicant** — the same trust the contract signing emails already rely on. The portal shows every adoption whose applicant email matches, so logging in is simple:

1. The applicant enters their email. The page always answers *"Falls es Bewerbungen zu dieser Adresse gibt, haben wir dir einen Link geschickt."* — whether or not the address is known (no account enumeration). A link is only sent when the address has adoptions to show.
2. The emailed link — an **Applicant Link** — is **valid for 4 hours and single-use**.
3. The link opens a page with a button (*Zum Portal*, or *Bewerbung bestätigen* for an application). **Only the click uses the link up.** Email security scanners (e.g. Outlook Safe Links) open links automatically and would otherwise use up a single-use link before the applicant ever sees it.
4. The click opens an **Applicant Session of 2 hours**. There is no "stay logged in"; an expired session leads back to the login.

The applicant's email is compared trimmed and lowercased, so `Anna@Example.com` and `anna@example.com` are the same applicant.

Emails entered by a mediator are trusted without confirmation. A typo sends the link to a stranger — the same accepted risk as for the contract signing emails.

### Technical notes

| | |
|---|---|
| Links | `applicant_links`: email, purpose (`confirm` \| `login`), the adoption for a confirmation, the **SHA-256 hash** of the token, `expires_at`, `used_at`. A self-contained token model, see [tokens.md](../coding-patterns/tokens.md) |
| Sessions | `applicant_sessions`: email, token hash, `expires_at`. The SPA keeps the plaintext token in `sessionStorage` and sends it as a bearer token; unrelated to the admin login |
| Mail links | `FrontendUriBuilder::applicationConfirm()` / `applicantLogin()` through `/callback` ([frontend-links.md](../coding-patterns/frontend-links.md)) |
| Rate limits | Throttle `applicant`: 60 requests per minute per IP; login requests 3 per minute per email; applications 5 per minute per IP |
| CSRF | The public routes use the same Sanctum CSRF cookie as the SPA |

Routes (all under `/internal`):

| Route | Purpose |
|---|---|
| `GET` / `POST /apply/{animal}` | The application form and submitting it |
| `POST /apply/confirm/{token}` | Confirms an application, returns a session token |
| `POST /portal/login`, `POST /portal/login/{token}`, `POST /portal/logout` | Requesting a login link, using it, logging out |
| `GET /portal/adoptions`, `GET /portal/adoptions/{adoption}` | The applicant's adoptions; any other adoption answers 404 |
| `PUT /portal/adoptions/{adoption}/case-file` | Saving the applicant's changes |

## Which adoptions are shown

| Status | In the portal |
|---|---|
| `unconfirmed` | Not shown — confirming *is* the first login |
| `pending`, `in_progress` | Readable and editable |
| `done` | Read-only: animal, steps, data |
| `canceled` | Only *"Bewerbung für Bello – beendet"*: no data and **no cancellation reason**, which is an internal note |

Adoptions without an email are never shown.

## What the applicant sees

Per adoption:

1. **Process overview** — the five steps with a simple status each. The application step shows as running until the mediator starts working on the adoption (`pending`), then as done. Internal details (inspector verdict and memo, mediator notes, requirement overrides) are never shown.
2. **Open items** — *"Für „Vertrag" fehlen noch 2 Angaben: Ausweisnummer, Geburtsdatum"*: the checklist items of the current step among the fields the applicant can see.
3. **Their data** — the fields described below, in the catalogue's groups, with live [conditions](./case-file.md#conditional-fields). Each field shows whether it is needed now (*Pflicht*) or for a later step (*Nötig für: Transport*).

### Which fields: the current step

The portal shows every field with `visible_to_applicant` and `collect_at` up to the adoption's **current step**: the first step that isn't finished yet.

| Adoption | Current step |
|---|---|
| `pending` (or `unconfirmed`) | `application` |
| pre-inspection not confirmed | `pre_inspection` |
| contract not signed | `contract` |
| transport not done | `transport` |
| otherwise | `handover` |

So once the mediator confirms the pre-inspection, the contract fields (e.g. the Ausweisnummer) appear in the portal by themselves. *Planned:* the mediator-controlled **Requested Step** replaces this derivation, so the applicant is only asked when the mediator decides (see [case-file.md](./case-file.md#requesting-data--split-collection)).

## Editing

While an adoption is `pending` or `in_progress`, the applicant can change every field they see. Rules:

- **Only their fields** — fields hidden from applicants, fields of later steps, files and Info Blocks can't be written; the server refuses them per field.
- **The email is read-only.** It is what the login is tied to. The applicant asks the mediator to change it.
- **Review** — a changed answer of a `requires_review` field goes back to *Prüfung offen*. Saving an unchanged value keeps its review.
- **Files** can't be uploaded yet. The form says so: *"Das Hochladen ist hier noch nicht möglich – bitte schick es direkt an die Vermittlung."*
- `done` and `canceled` adoptions can't be changed.

There is no locking. A mediator's correction can be changed back by the applicant; *planned:* the audit trail and the change notification make that visible.

## Planned

- **Audit trail** — every change recorded with the applicant as the actor ([audit-trail.md](./audit-trail.md)).
- **Change notifications** — the mediator's badge and daily summary of applicant changes, with an extra warning when a changed field is printed in an already generated contract ([case-file.md](./case-file.md#change-notifications)).
- **Requested Step** and request emails (*"Angaben für den Vertrag anfordern"*), see above.
- **File uploads** in the application form and the portal.
- **Rejected values** shown at the top with the mediator's note: *"Bitte lade ein Foto des Sicherheitsgeschirrs hoch – das Foto zeigt ein Halsband."*
- **Taking over data** — on a second adoption, *"Angaben aus früherer Bewerbung übernehmen"* in the portal (see [case-file.md](./case-file.md#second-adoption-by-the-same-applicant)).
- **Contract** — a link to a pending signature, and the download of the signed contract for `done` adoptions.
- **Magic links in Taily's own emails** (data requests, rejections) with the same rules as the login link.

## Relation to other token pages

The contract signing pages stay separate links with their own single-use, expiring tokens ([contract.md](./contract.md#access-and-security)), because their evidentiary requirements differ. The portal will link to them when a signature is pending.
