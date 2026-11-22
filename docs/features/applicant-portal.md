# Applicant Portal

The applicant portal (German UI: *Meine Bewerbungen*, at `/adopter`) shows an applicant their adoptions — from application to handover — together with the data they sent in. They can add to it and change it there.

The [public application](./adoption.md#application) is its entry point: confirming an application is the first login. See [ADR-016](../ADRs/ADR-016-adoption-case-file.md) and [ADR-018](../ADRs/ADR-018-applicant-data-on-the-adoption.md) for the reasoning.

## Access: email plus magic link

Applicants have no account and no password. **Whoever controls the mailbox is the applicant** — the same trust the contract signing emails already rely on. The portal shows every adoption whose applicant email matches, so logging in is simple:

1. The applicant enters their email. The page always answers *"Falls es Bewerbungen zu dieser Adresse gibt, haben wir dir einen Link geschickt."* — whether or not the address is known (no account enumeration). A link is only sent when the address has adoptions to show.
2. The emailed link — an **Applicant Link** — is **valid for 4 hours and single-use**.
3. The link opens a page with a button (*Zum Portal*, or *Bewerbung bestätigen* for an application). **Only the click uses the link up.** Email security scanners (e.g. Outlook Safe Links) open links automatically and would otherwise use up a single-use link before the applicant ever sees it.
4. The click opens an **Applicant Session of 2 hours**. There is no "stay logged in"; an expired session leads back to the login.

The applicant's email is compared trimmed and lowercased, so `Anna@Example.com` and `anna@example.com` are the same applicant.

Emails entered by a mediator are trusted without confirmation. A typo sends the link to a stranger — the same accepted risk as for the contract signing emails.

Login requests, applications and portal requests are rate-limited, so the forms can't be used to flood a mailbox or guess links.

## Which adoptions are shown

| Status | In the portal |
|---|---|
| E-Mail nicht bestätigt | Not shown — confirming *is* the first login |
| Zu prüfen, In Bearbeitung | Readable and editable |
| Abgeschlossen | Read-only: animal, steps, data |
| Abgebrochen | Only *"Bewerbung für Bello – beendet"*: no data and **no cancellation reason**, which is an internal note |

Adoptions without an email are never shown.

## What the applicant sees

Per adoption:

1. **Process overview** — the five steps with a simple status each. The application step shows as running until the mediator starts working on the adoption, then as done. Internal details (inspector verdict and memo, mediator notes, requirement overrides) are never shown.
2. **Open items** — *"Für „Vertrag" fehlen noch 2 Angaben: Ausweisnummer, Geburtsdatum"*: the checklist items of the current step among the fields the applicant can see.
3. **Their data** — the fields described below, in the catalogue's groups, with live [conditions](./case-file.md#conditional-fields). Each field shows whether it is needed now (*Pflicht*) or for a later step (*Nötig für: Transport*).

### Which fields: the current step

The portal shows every field visible to applicants that is asked up to the adoption's **current step**: the first step that isn't finished yet.

| Adoption | Current step |
|---|---|
| Zu prüfen | Bewerbung |
| pre-inspection not confirmed | Vorkontrolle |
| contract not signed | Vertrag |
| transport not done | Transport |
| otherwise | Übergabe |

So once the mediator confirms the pre-inspection, the contract fields (e.g. the Ausweisnummer) appear in the portal by themselves. The mediator doesn't decide when the applicant is asked; see [Planned](#planned).

## Editing

While an adoption is *Zu prüfen* or *In Bearbeitung*, the applicant can change every field they see. Rules:

- **Only their fields** — fields hidden from applicants, fields of later steps, files and Info Blocks can't be written; the server refuses them per field.
- **The email is read-only.** It is what the login is tied to. The applicant asks the mediator to change it.
- **Review** — a changed answer of a field that needs review goes back to *Prüfung offen*. Saving an unchanged value keeps its review.
- **Files** can't be uploaded yet. The form says so: *"Das Hochladen ist hier noch nicht möglich – bitte schick es direkt an die Vermittlung."*
- Completed and canceled adoptions can't be changed.

There is no locking. A mediator's correction can be changed back by the applicant, and the mediator isn't notified about it yet.

## Planned

- **Audit trail** — every change recorded with the applicant as the actor ([audit-trail.md](./audit-trail.md)).
- **Change notifications** — the mediator's badge and daily summary of applicant changes, with an extra warning when a changed field is printed in an already generated contract ([case-file.md](./case-file.md#planned)).
- **Requested Step** — the mediator decides when the applicant is asked for a step's data (*"Angaben für den Vertrag anfordern"*), instead of the derived current step ([case-file.md](./case-file.md#planned)).
- **File uploads** in the application form and the portal.
- **Rejected values** shown at the top with the mediator's note: *"Bitte lade ein Foto des Sicherheitsgeschirrs hoch – das Foto zeigt ein Halsband."*
- **Taking over data** — on a second adoption, *"Angaben aus früherer Bewerbung übernehmen"* in the portal ([case-file.md](./case-file.md#second-adoption-by-the-same-applicant)).
- **Contract** — a link to a pending signature, and the download of the signed contract for `done` adoptions.
- **Magic links in Taily's own emails** (data requests, rejections) with the same rules as the login link.

## Relation to other token pages

The contract signing pages stay separate links with their own single-use, expiring tokens ([contract.md](./contract.md#access-and-security)), because their evidentiary requirements differ. The portal will link to them when a signature is pending.
