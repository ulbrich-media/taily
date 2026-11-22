# Adoption

An adoption (German UI: *Vermittlung*) is the complete process of finding and confirming a new owner for an animal. It begins when someone applies to adopt and ends when the animal has been handed over — or when the process is canceled.

The adoption is self-contained. Everything relevant to *if and how* it happens is kept on it:

- **the applicant's data** — name, contact, address, date of birth — in fixed columns ([ADR-018](../ADRs/ADR-018-applicant-data-on-the-adoption.md)),
- **the [Case File](./case-file.md)** — every configured field of the animal's type,
- **the [pre-inspections](./pre-inspection.md)**, the [contract](./contract.md) and the [transport](./transport.md).

The applicant is not a [Person](../data-scheme.md#person). An adoption can *reference* a Person Taily already manages, but never reads its data from there.

## General status

Every adoption has a general status that gives the mediator a quick overview:

| Status | German UI | Meaning |
|---|---|---|
| `unconfirmed` | E-Mail nicht bestätigt | A public application whose email address hasn't been confirmed yet (see [Application](#application)) |
| `pending` | Zu prüfen | The application has arrived, but the mediator hasn't started working on it yet |
| `in_progress` | In Bearbeitung | The mediator is actively working through the adoption |
| `canceled` | Abgebrochen | The adoption was stopped. A reason is always documented |
| `done` | Abgeschlossen | The animal has been handed over. The adoption is complete |

## Steps

The steps are a **fixed set, owned by code**. Organizations do not configure steps; they configure which data is needed at which step (see [case-file.md](./case-file.md)). Steps are not enforced in a fixed order — the mediator decides which steps are needed and when, and can skip a step entirely.

| Step | German UI | What happens | Details |
|---|---|---|---|
| `application` | Bewerbung | The applicant sends in the data asked at application | [Application](#application) |
| `pre_inspection` | Vorkontrolle | A visit, video call or home video shows whether the home suits the animal | [pre-inspection.md](./pre-inspection.md) |
| `contract` | Vertrag | The Schutzvertrag is generated and signed | [contract.md](./contract.md) |
| `transport` | Transport | The animal travels to the adopter or a staging point | [transport.md](./transport.md) |
| `handover` | Übergabe | The animal is physically handed over; the adoption is done | — |

For data requirements the steps have a nominal order (application → pre-inspection → contract → transport → handover): a field required for the contract is still required for transport. That order exists only for data; it does not force the process.

### Pre-inspection

The mediator closes the pre-inspection step with a **confirmation** (*"Vorkontrolle bestätigt"*, with who confirmed it and when) — with or without a [pre-inspection](./pre-inspection.md) record, and regardless of its verdict. They base it on pre-inspections, a home video, earlier pre-inspections of the same applicant, or none of these (e.g. a known repeat adopter). There is no rejection on the step: a rejection means canceling the adoption, with a reason. The confirmation can be withdrawn.

| Step status | When |
|---|---|
| finished | the pre-inspection is confirmed |
| pending | not confirmed, but a pre-inspection exists or a field (e.g. the home video) was made required for this step |
| not_started | neither |

### Requirements per step

Each step has a [Checklist](./case-file.md#checklist) of the data it needs: fields required by the catalogue, by the chosen contract template, or by the mediator's per-adoption overrides. The checklist blocks contract generation while a field the chosen template requires is missing — the mediator waives a field if needed. For every other step it informs but does not block.

## Starting an adoption

An adoption starts in one of two ways.

### Application

A public application creates an adoption for **one animal**.

1. **The link.** The mediator copies the application link from the animal's menu (*Bewerbungslink kopieren*) and shares it, e.g. on the website. It opens `/apply/{animal}`. There is no public list of animals in Taily.
2. **The form.** The form shows the catalogue fields of the animal's type that are visible to applicants and asked at application, in the catalogue's groups, with their Info Blocks and [conditions](./case-file.md#conditional-fields). Each field says whether it is needed now (*Pflicht*) or only later (*Nötig für: Vertrag*). Submitting reports every missing required field at once.
3. **Unconfirmed.** The adoption is stored with status `unconfirmed`, with the applicant's data and Case File values on the adoption as usual. Mediators already see it, marked *"E-Mail nicht bestätigt"*.
4. **Double opt-in.** Taily emails a confirmation link (an [Applicant Link](./applicant-portal.md#access-email-plus-magic-link)). Confirming sets the adoption to `pending` and opens the applicant's first [portal](./applicant-portal.md) session. From then on the confirmed email links the adoption to the applicant's other adoptions. Until then it links nothing: anyone can type someone else's address into the form, so an unconfirmed application is neither listed under that applicant's earlier adoptions nor on a Person's page, and its data can't be taken over.

Applications are refused for animals that are deceased, boarding animals, or already adopted (a `done` adoption exists). Their link only shows *"Keine Bewerbung möglich"*, without the animal's name or picture. A reserved animal still takes applications; the mediator decides.

One email address can send at most 3 applications an hour and 10 a day; attempts that are refused for missing data don't count.

An application never touches a Person or another adoption, so a public form can't be used to change someone else's data. Public applications have no mediator; one is assigned in the admin.

### Created by a mediator

After a phone call or an email, the mediator creates the adoption in the admin (*Neue Vermittlung*) with either:

- **Neue Angaben** — first and last name, optionally email and phone, typed in, or
- **Bekannte Person** — a Person Taily already manages (a foster carer adopting their foster animal, an inspector). Their data is **copied once** into the adoption and the Person is referenced.

These adoptions start as `pending` and need no confirmation; the emails mediators enter are trusted.

## The applicant and their other adoptions

The applicant's data belongs to this adoption only: a correction never changes another adoption or a Person ([ADR-018](../ADRs/ADR-018-applicant-data-on-the-adoption.md)).

- **Earlier adoptions** — the adoption page lists the applicant's other adoptions (*Frühere Vermittlungen*): those with the same confirmed email, or referencing the same Person. Each shows why it matches, its status and its pre-inspections.
- **Taking over data** — from one of those adoptions, *"Angaben übernehmen"* fills every field that is still empty here. See [case-file.md](./case-file.md#second-adoption-by-the-same-applicant).
- **Person reference** — the mediator can link or unlink a Person at any time (*Mit Person verknüpfen*). That sets only the reference; nothing is copied or synchronised. A Person's page lists the adoptions that reference them or use their email.

## Changing the animal

The animal of an adoption can be changed in the admin — e.g. *"Bello ist reserviert, aber Luna würde passen"*. The Case File stays; requirements are recalculated. There is no restriction yet: changing to an animal of another type, or after a pre-inspection or contract, quietly invalidates what was gathered for the first animal. An adoption always has an animal; there are no general applications.

## Applicant portal

The applicant logs in with their email and a magic link, sees all their adoptions and edits their data. See [applicant-portal.md](./applicant-portal.md).

## Cancellation

An adoption can be canceled at any point, regardless of which steps are done. The mediator documents a reason, kept separate from the general notes so it is easy to see why the adoption ended. The reason is internal; the portal only shows that the application ended. A canceled adoption can be reopened.

## The owner after handover

The animal's owner is a Person, set by hand on the animal. An adopter without a Person reference can't be set as the owner until a Person is created for them; the handover doesn't set the owner.

## Planned

- **Restricting animal changes** to another animal of the same animal type, as long as no pre-inspection exists and no contract has been generated. After that the outcome of the process depends on the animal.
- **Cleaning up unconfirmed applications** after a number of days.
- **Requesting data** for a later step, see [case-file.md](./case-file.md#planned).
- **Audit trail** — every change to an adoption and its Case File recorded: who, what, when, old and new value. See [audit-trail.md](./audit-trail.md). The adoption page already has its *Verlauf* tab.
- **Ownership after handover** — how the owner follows from the handover is open.
- **Follow-up inspection** — some time after a successful adoption, a check that the animal is thriving. It does not change the adoption status; any follow-up action happens outside the adoption process.
