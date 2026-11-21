# Data scheme

> This page describes the target model from [ADR-016](./ADRs/ADR-016-adoption-case-file.md) and [ADR-017](./ADRs/ADR-017-contract-templates-as-configuration.md). Parts marked *planned* are not implemented yet.

Three models carry the domain:

- **Animal** — an adoptable animal of any type. Everything revolves around it.
- **Person** — identifies a human: who they are and how to reach them. A person can hold several roles.
- **Adoption** — the process of finding a new owner for an animal, and the place where everything relevant to *if and how* that happens is stored.

The key rule: **data that decides whether and how an adoption happens belongs to the adoption, not to the person.** Requirements depend on the animal (a Chihuahua is not a Husky) and on how far the adoption has progressed, so the data sits next to both. See [ADR-016](./ADRs/ADR-016-adoption-case-file.md) for the reasoning.

```
Animal ──< Adoption >── Person (applicant)
             │  └────── Person (mediator)
             ├──< Field Value >── Field Definition ──> Field Group
             ├──< Requirement Override
             ├──< Pre-Inspection >── Person (inspector)
             ├──> Contract Template
             ├──< Contract Signing Process
             └──> Transport
```

## Animal

An animal that is or was open for adoption, with all information about it.

- **Animal Type** — every animal has one (dog, cat). It determines vaccinations, medical tests, which Case File fields apply and which contract templates are offered.
- **Vaccination** — a vaccination type defined per Animal Type, linked to animals with `vaccinated_at`.
- **Medical Test** — a health or sickness test type defined per Animal Type, linked to animals with `tested_at` and a result.
- **Custom fields** *(planned, approach open)* — organization-defined fields on the animal, e.g. for the website or internal notes. See [features/form-templates.md](./features/form-templates.md#future-of-the-form-builder).

## Person

A person identifies a human: first and last name, email, phone, mobile, address, date of birth, picture, and optionally the **Organization** they represent (an external club or partner).

A person holds roles:

- **Mediator** — per animal type
- **Foster** — per animal type
- **Inspector** — per animal type
- **Applicant / Adopter** — only when an adoption references them (optional, see below)

Applicants are **not** Persons by default: an adoption holds its applicant's data itself ([ADR-018](./ADRs/ADR-018-applicant-data-on-the-adoption.md)). An adoption can *reference* a Person Taily already manages — a foster carer adopting their foster animal, an inspector — but the Person is never the source of the adoption's data.

The person deliberately holds **no** adoption-specific data.

## Adoption

The adoption process is started by an application. The mediator guides it through its steps until the animal is handed over or the process is canceled. See [features/adoption.md](./features/adoption.md).

### `adoptions` table

| Field | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `animal_id` | uuid FK → animals | The animal being adopted |
| `mediator_id` | uuid FK → people, nullable | The mediator handling the adoption |
| `applicant_first_name`, `applicant_last_name` | string | The applicant's name |
| `applicant_email` | string, indexed | Stored trimmed and lowercased; links the applicant's adoptions and is the portal login |
| `applicant_phone`, `applicant_mobile` | string | |
| `applicant_date_of_birth` | date, nullable | |
| `applicant_street_line`, `applicant_street_line_additional`, `applicant_postal_code`, `applicant_city`, `applicant_country_code` | string | The applicant's address |
| `applicant_person_id` | uuid FK → people, nullable | Optional reference to a Person Taily manages; never a data source. Data is copied once when an adoption is started from a Person |
| `transport_id` | uuid FK → transports, nullable | The transport the animal is assigned to |
| `requested_step` | enum, nullable | *(planned)* How far data collection has been opened to the applicant |
| `status` | enum | `pending`, `in_progress`, `canceled`, `done`; *(planned)* `unconfirmed` |
| `canceled_at` | timestamp, nullable | When the adoption was canceled |
| `canceled_reason` | text | Why the adoption was canceled |
| `notes` | text | General mediator notes |
| `pre_inspection_notes` | text | Mediator notes on the pre-inspection step |
| `pre_inspection_confirmed_at`, `pre_inspection_confirmed_by` | timestamp / FK → users, nullable | The mediator's confirmation that closes the pre-inspection step |
| `applicant_changes_seen_at` | timestamp, nullable | *(planned)* When a user last acknowledged the applicant's changes |
| `contract_signed` | boolean | Whether the contract has been signed by both parties |
| `contract_signed_at` | timestamp, nullable | When the contract was signed |
| `handed_over_at` | timestamp, nullable | When the animal was handed over |

The applicant columns are exposed as **built-in fields** of every Case File catalogue, so the same requirement rules apply to them (e.g. the address is only required for the contract). They belong to this adoption only: a correction never changes another adoption or a Person. Adoptions of the same applicant are found by `applicant_email` or `applicant_person_id`.

### Per-step status

Steps are optional and can be taken in any order. Each derives its status from its own data:

| Step | not_started / pending | in_progress | finished |
|---|---|---|---|
| Pre-inspection | *(planned)* neither confirmed nor a pre-inspection or home-video request exists | a pre-inspection exists or the home video was requested | `pre_inspection_confirmed_at` is set |
| Contract | `not_started`: no signing process, or the latest is `cancelled`/`expired`. `pending`: the latest is awaiting a signature | — | `contract_signed` is true |
| Transport | `transport_id` is null | transport assigned, not done | transport done |
| Handover | `handed_over_at` is null | — | `handed_over_at` is set |

The contract step's coarse status is derived from `contract_signed` plus the latest `ContractSigningProcess`; the full five-value status is exposed separately. See [features/contract.md](./features/contract.md) and [ADR-012](./ADRs/ADR-012-contract-generation-and-signing.md).

Independently of these statuses, each step has a [Checklist](./features/case-file.md#checklist) of missing data *(planned)*.

### Case File *(planned)*

The adoption's configurable data. Full description in [features/case-file.md](./features/case-file.md).

| Table | Content |
|---|---|
| `field_groups` | Titled sections with an optional intro, ordered — per animal type |
| `field_definitions` | The catalogue: key, type, group, `collect_at`, `required_for`, `requires_review`, `visible_to_applicant`, `visible_to_inspector`, `condition`; per animal type, keys unique per type |
| `adoption_field_values` | One row per adoption and field: current value (files via media), review status |
| `adoption_requirements` | Per-adoption overrides: require, waive or move a field's due step |

### Pre-Inspection *(planned)*

`pre_inspections` belong to an adoption: inspector, verdict, memo, submission time, access token. See [features/pre-inspection.md](./features/pre-inspection.md).

## Contract Template *(planned)*

`contract_templates` hold a title, the animal types they are offered for, the wording and three ordered lists of field keys (animal, mediator, adopter). The mediator picks one at generation. The fields printed by the templates of an animal type are required for the contract step. See [ADR-017](./ADRs/ADR-017-contract-templates-as-configuration.md).

## Transport

A transport moves one or more animals toward their adopters. Multiple adoptions can be assigned to the same transport. See [features/transport.md](./features/transport.md).

## Audit trail *(planned)*

Changes to animals, people, adoptions and their Case Files are recorded. See [features/audit-trail.md](./features/audit-trail.md).

## User

A user is anyone with credentials for logging into the admin application. Users administrate Taily, manage people or animals and guide adoptions.

Applicants and inspectors have no user account. They get token-based access: the pre-inspection page, the contract signing pages, and *(planned)* the applicant portal.

## Removed or under review

The **person-level pre-inspections** and their form template are replaced by adoption-level pre-inspections. Taily is in beta; existing data is not migrated.

The **form builder** (form templates, versions, submissions) stays for now: its future depends on how animal custom fields are built (see [features/form-templates.md](./features/form-templates.md#future-of-the-form-builder)).
