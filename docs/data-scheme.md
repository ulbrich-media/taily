# Data scheme

> The reasoning behind this model is in [ADR-016](./ADRs/ADR-016-adoption-case-file.md) (Case File), [ADR-017](./ADRs/ADR-017-contract-templates-as-configuration.md) (contract templates) and [ADR-018](./ADRs/ADR-018-applicant-data-on-the-adoption.md) (applicant data).

Three models carry the domain:

- **Animal** — an adoptable animal of any type. Everything revolves around it.
- **Person** — someone Taily manages: mediators, fosters, inspectors, contacts of other organizations. A person can hold several roles.
- **Adoption** — the process of finding a new owner for an animal, and the place where everything relevant to *if and how* that happens is stored — including who the applicant is.

The key rule: **data that decides whether and how an adoption happens belongs to the adoption.** Requirements depend on the animal (a Chihuahua is not a Husky) and on how far the adoption has progressed, so the data sits next to both. See [ADR-016](./ADRs/ADR-016-adoption-case-file.md) for the reasoning. The applicant's identity is part of that: an adoption holds its applicant's data itself ([ADR-018](./ADRs/ADR-018-applicant-data-on-the-adoption.md)).

```
Animal ──< Adoption ─ ─ > Person (applicant, optional reference)
             │  └──────> Person (mediator)
             ├──< Field Value >── Field Definition ──> Field Group
             ├──< Requirement Override
             ├──< Pre-Inspection >── Person (inspector)
             ├──< Contract Signing Process ──< Contract Signer
             ├──< Applicant Link
             └──> Transport

Animal Type ──< Field Group, Field Definition       (one catalogue per type)
Animal Type ──< Contract Template                   (several templates per type)
Applicant Session ─ ─ adoptions by applicant_email  (no foreign key)
```

## Animal

An animal that is or was open for adoption, with all information about it.

- **Animal Type** — every animal has one (dog, cat). It determines vaccinations, medical tests, the Case File catalogue and which contract templates are offered.
- **Vaccination** — a vaccination type defined per Animal Type, linked to animals with `vaccinated_at`.
- **Medical Test** — a health or sickness test type defined per Animal Type, linked to animals with `tested_at` and a result.
- **Owner** — `owner_id`, a Person, set by hand on the animal (e.g. after a handover, or the owner of a boarding animal).

## Person

A person: first and last name, email, phone, mobile, address, date of birth, picture, and optionally the **Organization** they represent (an external club or partner).

A person holds roles:

- **Mediator** — per animal type
- **Foster** — per animal type
- **Inspector** — per animal type
- **Applicant / Adopter** — only when an adoption references them (optional, see below)

Applicants are **not** Persons by default: an adoption holds its applicant's data itself. An adoption can *reference* a Person Taily already manages — a foster carer adopting their foster animal, an inspector — but the Person is never the source of the adoption's data. A Person's adoptions are those that reference them or use their email.

The person deliberately holds **no** adoption-specific data.

## Adoption

The adoption process is started by an application or by a mediator. The mediator guides it through its steps until the animal is handed over or the process is canceled. See [features/adoption.md](./features/adoption.md).

### `adoptions` table

| Field | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `animal_id` | uuid FK → animals | The animal being adopted |
| `mediator_id` | uuid FK → people, nullable | The mediator handling the adoption |
| `applicant_first_name`, `applicant_last_name` | string | The applicant's name |
| `applicant_email` | string, indexed | Stored trimmed and lowercased; links the applicant's adoptions and is the portal login. Not unique |
| `applicant_phone` | string | One number, mobile or landline |
| `applicant_date_of_birth` | date, nullable | |
| `applicant_street_line`, `applicant_street_line_additional`, `applicant_postal_code`, `applicant_city`, `applicant_country_code` | string | The applicant's address |
| `applicant_person_id` | uuid FK → people, nullable, null on delete | Optional reference to a Person Taily manages; never a data source. Data is copied once when an adoption is started from a Person |
| `transport_id` | uuid FK → transports, nullable | The transport the animal is assigned to |
| `status` | enum | `unconfirmed`, `pending`, `in_progress`, `canceled`, `done` |
| `canceled_at` | timestamp, nullable | When the adoption was canceled |
| `canceled_reason` | text | Why the adoption was canceled. Internal |
| `notes` | text | General mediator notes |
| `pre_inspection_notes` | text | Mediator notes on the pre-inspection step |
| `pre_inspection_confirmed_at`, `pre_inspection_confirmed_by` | timestamp / FK → users, nullable | The mediator's confirmation that closes the pre-inspection step |
| `contract_signed` | boolean | Whether the contract has been signed by both parties |
| `contract_signed_at` | timestamp, nullable | When the contract was signed |
| `handed_over_at` | timestamp, nullable | When the animal was handed over |

The applicant columns are exposed as **built-in fields** of every Case File catalogue, so the same requirement rules apply to them (e.g. the address is only required for the contract). They belong to this adoption only: a correction never changes another adoption or a Person. Adoptions of the same applicant are found by `applicant_email` or `applicant_person_id`; the link is derived, never stored.

### Per-step status

Steps are optional and can be taken in any order. Each derives its status from its own data:

| Step | not_started / pending | in_progress | finished |
|---|---|---|---|
| Pre-inspection | `not_started`: neither confirmed nor a pre-inspection nor a field made required for this step. `pending`: a pre-inspection exists or a field was made required for this step | — | `pre_inspection_confirmed_at` is set |
| Contract | `not_started`: no signing process, or the latest is `cancelled`/`expired`. `pending`: the latest is awaiting a signature | — | `contract_signed` is true |
| Transport | `transport_id` is null | transport assigned, not done | transport done |
| Handover | `handed_over_at` is null | — | `handed_over_at` is set |

The contract step's coarse status is derived from `contract_signed` plus the latest `ContractSigningProcess`; the full five-value status is exposed separately. See [features/contract.md](./features/contract.md) and [ADR-012](./ADRs/ADR-012-contract-generation-and-signing.md).

Independently of these statuses, each step has a [Checklist](./features/case-file.md#checklist) of missing data.

### Case File

The adoption's configurable data. Full description in [features/case-file.md](./features/case-file.md).

| Table | Content |
|---|---|
| `field_groups` | Titled sections with an optional intro, ordered — per animal type |
| `field_definitions` | The catalogue: key, type, group, `collect_at`, `required_for`, `requires_review`, `visible_to_applicant`, `visible_to_inspector`, `condition`, `applicant_attribute` (built-in fields); per animal type, keys unique per type |
| `adoption_field_values` | One row per adoption and field: current value (JSON), review status (`null` \| `pending` \| `confirmed` \| `rejected`), review note, reviewer and time |
| `adoption_requirements` | Per-adoption overrides: require, waive or move a field's due step |

### Pre-Inspection

`pre_inspections` belong to an adoption: inspector (nullable), verdict (`null` \| `approved` \| `rejected`), memo, `submitted_at`, and an access token (`HasAccessToken`) usable until it is submitted. See [features/pre-inspection.md](./features/pre-inspection.md).

### Applicant access

The public application and the [applicant portal](./features/applicant-portal.md) identify an applicant by their email.

| Table | Content |
|---|---|
| `applicant_links` | Single-use emailed links: email, purpose (`confirm` an application \| `login`), the adoption for a confirmation, the SHA-256 hash of the token, `expires_at` (4 hours), `used_at` |
| `applicant_sessions` | Portal sessions: email, token hash, `expires_at` (2 hours). They show every adoption with that `applicant_email` |

The SPA keeps the session token in `sessionStorage` and sends it as a bearer token, unrelated to the admin login. Mail links go through `FrontendUriBuilder` (`applicationConfirm()`, `applicantLogin()`). The public routes are throttled: 60 requests per minute per IP, login links 3 per minute per email, applications 5 per minute per IP.

## Contract

### Contract Template

`contract_templates` hold their `animal_type_id`, a name, a printed title, the wording (`body`, Markdown) and three ordered sections — `animal_fields`, `mediator_fields`, `adopter_fields` — each a list of `{key, required}`; plus `archived_at`. Animal and mediator keys are prefixed (`animal.tasso_id`, `mediator.full_name`); adopter keys are the catalogue's field keys (`address`, `id_card_number`). The mediator picks one of the type's active templates at generation. The fields they mark as required are required for the contract step. See [ADR-017](./ADRs/ADR-017-contract-templates-as-configuration.md) and [features/contract.md](./features/contract.md#contract-templates).

### Signing

`contract_signing_processes` hold the frozen documents and hashes of one signing attempt; `contract_signing_audit_events` its evidentiary log. Each `contract_signers` row keeps the `name` and `email` the signer was invited with; `person_id` is an optional reference (the mediator; the adopter only when the adoption references a Person), nulled when the Person is deleted. See [features/contract.md](./features/contract.md).

## Transport

A transport moves one or more animals toward their adopters. Multiple adoptions can be assigned to the same transport. See [features/transport.md](./features/transport.md).

## User

A user is anyone with credentials for logging into the admin application. Users administrate Taily, manage people or animals and guide adoptions.

Applicants and inspectors have no user account. They get token-based access: the pre-inspection page, the contract signing pages, and the applicant portal (by email and magic link).

## Under review

The **form builder** (form templates, versions, submissions) has no consumer at the moment. Its future depends on how custom fields on the animal are built (see [features/form-templates.md](./features/form-templates.md#future-of-the-form-builder)).

## Planned

- **Custom fields on the animal** — organization-defined fields, e.g. for the website or internal notes; approach open.
- **Audit trail** — changes to animals, people, adoptions and their Case Files ([features/audit-trail.md](./features/audit-trail.md)).
- On the adoption: the requested step and when the applicant's changes were last seen ([features/case-file.md](./features/case-file.md#planned)).
