# Adoption

An adoption (German UI: *Vermittlung*) is the complete process of finding and confirming a new owner for an animal. It begins when someone applies to adopt and ends when the animal has been handed over — or when the process is canceled.

The adoption is also where everything relevant to *if and how* it happens is kept: the applicant's data in the [Case File](./case-file.md), the pre-inspections, the contract, the transport. The applicant themselves is a [Person](../data-scheme.md#person), which only identifies them.

> Parts of this page describe the planned design from [ADR-015](../ADRs/ADR-015-adoption-case-file.md) (marked *planned*).

## General status

Every adoption has a general status that gives the mediator a quick overview:

- **Unconfirmed** *(planned)* — a public application whose email address has not been confirmed yet (see [Application](#application-planned)). Shown to mediators marked *"E-Mail nicht bestätigt"*.
- **Pending** — the application has arrived but the mediator hasn't started working on it yet.
- **In progress** — the mediator is actively working through the adoption.
- **Canceled** — the adoption was stopped. A reason is always documented.
- **Done** — the animal has been handed over. The adoption is complete.

## Steps

The steps are a **fixed set, owned by code**. Organizations do not configure steps; they configure which data is needed at which step (see [case-file.md](./case-file.md)). Steps are not enforced in a fixed order — the mediator decides which steps are needed and when, and can skip a step entirely.

| Step | German UI | What happens | Details |
|---|---|---|---|
| `application` | Bewerbung | The applicant sends in the data asked at application | [case-file.md](./case-file.md#requesting-data--split-collection) |
| `pre_inspection` | Vorkontrolle | A visit, video call or home video shows whether the home suits the animal | [inspection.md](./pre-inspection.md) |
| `contract` | Vertrag | The Schutzvertrag is generated and signed | [contract.md](./contract.md) |
| `transport` | Transport | The animal travels to the adopter or a staging point | [transport.md](./transport.md) |
| `handover` | Übergabe | The animal is physically handed over; the adoption is done | — |

For data requirements the steps have a nominal order (application → pre-inspection → contract → transport → handover): a field required for the contract is still required for transport. That order exists only for data; it does not force the process.

### Pre-inspection

The mediator closes the pre-inspection step with a **confirmation** (*"Vorkontrolle bestätigt"*, `pre_inspection_confirmed_at` plus the confirming user) — with or without a [pre-inspection](./pre-inspection.md) record, and regardless of its verdict. They base it on pre-inspections, a home video, earlier pre-inspections of the same person, or none of these (e.g. a known repeat adopter). There is no rejection on the step: a rejection means canceling the adoption, with a reason.

| Step status | When |
|---|---|
| finished | the pre-inspection is confirmed |
| pending | not confirmed, but a pre-inspection exists or the home video was requested |
| not_started | neither |

### Requirements per step *(planned)*

Each step has a [Checklist](./case-file.md#checklist) of the data it needs: fields required by the catalogue, by the contract template, or by the mediator's per-adoption overrides. The checklist blocks contract generation (including the download for manual signing) while contract data is missing — the mediator waives a field if needed. For every other step it informs but does not block.

### Split data collection *(planned)*

The application asks only what is needed to decide whether the applicant fits. Later data — contract details, transport details — is requested when the mediator advances the adoption's `requested_step` ("Angaben für den Vertrag anfordern"). The applicant gets a form with exactly the missing fields. See [case-file.md](./case-file.md#requesting-data--split-collection).

## Application *(planned)*

A public application creates an adoption for **one animal**. Every public application has to be **confirmed by email** (double opt-in):

1. The applicant submits the form. The adoption is stored with status `unconfirmed`, with the applicant's data and Case File values on the adoption as usual ([ADR-017](../ADRs/ADR-017-applicant-data-on-the-adoption.md)).
2. Taily sends a confirmation link. Mediators already see the application, marked *"E-Mail nicht bestätigt"*.
3. On confirmation the adoption is set to `pending`. The confirmed email now links it to the applicant's earlier adoptions and to the portal.

An application never touches a Person or another adoption, so a public form can't be used to change someone else's data. Unconfirmed applications may be cleaned up after a number of days later on.

Adoptions created by a mediator (e.g. after a phone call) need no confirmation; the emails mediators enter are trusted.

## Changing the animal

The animal of an adoption can be changed to **another animal of the same animal type** — e.g. *"Bello ist reserviert, aber Luna würde passen"* — as long as no pre-inspection exists and no contract has been generated. After that, the outcome of the process depends on the animal, and a change would quietly invalidate it. The Case File stays; requirements are recalculated. An adoption always has an animal; there are no general applications.

## Applicant portal *(planned)*

The applicant logs in with their email and a magic link, and sees all their adoptions and their data. See [applicant-portal.md](./applicant-portal.md).

## Cancellation

An adoption can be canceled at any point, regardless of which steps are done. The mediator documents a reason, kept separate from the general notes so it is easy to see why the adoption ended.

## Follow-up inspection

After a successful adoption, a follow-up inspection may happen some time later to make sure the animal is thriving. It does not change the adoption status — if something is wrong, any follow-up action happens outside the normal adoption process. *(Future feature.)*

## Multiple adoptions

- Multiple adoptions can exist for the same animal or person at different points in time.
- All adoptions of a person or animal are listed on their pages.
- *(planned)* A new adoption by a known person shows their earlier adoptions and pre-inspections as a cross-reference, and values can be imported from an earlier adoption. See [case-file.md](./case-file.md#second-adoption-by-the-same-person).

## Audit trail *(planned)*

Every change to an adoption and its Case File is recorded — who, what, when, old and new value. See [audit-trail.md](./audit-trail.md).
