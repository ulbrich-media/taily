# Data scheme 

The data model is relatively simple. There are 3 key models: 
- Animal: An adoptable animal of any type 
- Person: A person fulfilling a role in the adoption process
- Adoption: The actual adoption process of finding a new owner for the animal.

## Data models

### Animal

An animal that is or was open for adoption. With all his information that is relevant for his adoption. 

#### Animal Type 

Any animal has to be an animal type (like dog, cat). The animal type allows customizing both the animal and the adoption process to meet the requirements of that kind of animal. 

#### Health Condition

A health condition represents either a kind of sickness an animal may have been tested for or a vaccination an animal may receive. Health conditions are created animal type specific and are available while editing these animals. 

### Person 

A person can fulfil multiple roles, requiring different data and making them relevant in different parts of the adoption.
- Mediator
- Adopter
- Foster
- Inspector

#### Organization 

A person may represent an organization (like a club or a non-profit), so these can be managed and assigned to a person as well.

#### Pre-Inspection

At any given time (but ordinarily during an adoption) a pre-inspection can be triggered for a person. It's meant to make sure that the adopter is suitable as an owner for a specific animal type. 

Learn more in [features/pre-inspection.md](./features/pre-inspection.md)

### Adoption 

The adoption process itself is started by an application by the possible adopter. The mediator guides the adoption through its steps until the animal is successfully handed over or the process is canceled.

Learn more in [features/adoption.md](./features/adoption.md)

#### `adoptions` table

| Field | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `animal_id` | uuid FK → animals | The animal being adopted |
| `mediator_id` | uuid FK → people, nullable | The mediator handling the adoption |
| `applicant_id` | uuid FK → people | The person applying to adopt |
| `transport_id` | uuid FK → transports, nullable | The transport the animal is assigned to (stub — full transport lifecycle TBD) |
| `status` | enum | General lifecycle status: `pending`, `in_progress`, `canceled`, `done` |
| `canceled_at` | timestamp, nullable | When the adoption was canceled |
| `canceled_reason` | text | Why the adoption was canceled (specific, separate from internal_notes) |
| `application_notes` | text | Mediator notes on the application |
| `pre_inspection_notes` | text | Mediator notes on the pre-inspection step |
| `contract_sent_at` | date, nullable | When the contract was sent to the adopter |
| `contract_signed` | boolean | Whether the contract has been signed by both parties |
| `contract_signed_at` | timestamp, nullable | When the contract was signed |
| `handed_over_at` | timestamp, nullable | When the animal was handed over to the adopter |

#### Status values

| Value | Meaning |
|---|---|
| `pending` | Application received; mediator has not yet started working on it |
| `in_progress` | Mediator is actively processing the adoption |
| `canceled` | Process was stopped; reason is documented in `canceled_reason` |
| `done` | Animal successfully handed over to the adopter |

#### Per-step status derivation

Steps are optional and can be taken in any order. Each step derives its status independently from its own fields:

| Step | not_started | in_progress | finished |
|---|---|---|---|
| Contract | `contract_sent_at` is null and `contract_signed` is false | `contract_sent_at` is set, not signed | `contract_signed` is true |
| Transport | `transport_id` is null | transport assigned (details TBD) | transport completed (TBD) |
| Handover | `handed_over_at` is null | — | `handed_over_at` is set |

The pre-inspection step is tracked via `pre_inspection_notes` and indirectly through pre-inspection records linked to the applicant.

#### Relations

- Pre-inspections are not stored directly on the adoption. They are linked to the applicant (person) and can be viewed from the person's profile.
- Transport is a separate entity (`transports` table) shared across multiple adoptions. Its full lifecycle is implemented in a later phase.

### Transport

A transport moves one or more animals from their current location toward their adopters. Multiple adoptions can be assigned to the same transport.

The transport feature is currently a stub. The `transports` table exists to allow adoptions to reference a transport, but full transport management (scheduling, departure, arrival tracking) is not yet implemented.

Learn more in [features/transport.md](./features/transport.md)

### User

A user is anyone with credentials for logging into this application. They administrate this application, manage persons or animals or guide through an adoption. 

In the future, there may be other types of users like adopters, inspectors, fosters. They are currently either not part of this applications frontend or receive token based access. 
