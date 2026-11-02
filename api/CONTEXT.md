# API — Adoption Domain

The core domain: finding and confirming a new owner for an animal, from initial application through handover. All domain terms are defined here; the frontend context extends this vocabulary for UI-specific concepts.

## Language

### People

**Person**: Anyone relevant to the adoption process who can hold one or more roles (Mediator, Applicant/Adopter, Foster, Inspector). A Person only identifies a human (name, contact, address, date of birth); data about *if and how* an adoption happens belongs to the Adoption's Case File.
_Avoid_: Contact, Individual, Human

**Member**: A Person who is affiliated with the Operating Organization. May or may not have login credentials.
_Avoid_: Staff, Team member

**User**: A Member who has login credentials to the admin application.
_Avoid_: Admin

**Operating Organization**: The single non-profit or club that owns and runs this Taily installation. Always exactly one. It is the "us" in the system — it manages Animals, assigns Members to roles, and conducts Adoptions.
_Avoid_: Organization (ambiguous — see below), Operator, Club

**Organization**: A data entity that can be added to Taily and assigned to a Person, representing an external club or partner the Operating Organization collaborates with. Used to categorize and visualize Persons who belong to or represent outside groups.
_Avoid_: Partner, External organization, Club

**Mediator**: A Member who supervises and guides an Adoption from application through handover or cancellation.
_Avoid_: Handler, Manager, Coordinator

**Applicant**: A Person who has applied to adopt an Animal but whose Adoption has not yet been accepted (status: pending). Once the Mediator starts working on the Adoption, the person becomes an Adopter.
_Avoid_: Potential adopter, Candidate, Interested party

**Adopter**: A Person whose Adoption is actively being worked on or has completed (status: in_progress or done). The term applies from the moment the Mediator accepts the application, not only after the Handover.
_Avoid_: Owner (until handover is confirmed), Applicant (once the adoption is in_progress)

**Foster**: A Person who temporarily houses an Animal until handover to the Adopter.
_Avoid_: Caretaker, Temporary home, Pflegestelle (outside German UI strings)

**Inspector**: A Person who performs an Inspection of an Applicant's home and living conditions.
_Avoid_: Evaluator, Assessor, Prüfer (outside German UI strings)

### Animals

**Animal**: An individual animal that is or was available for adoption.
_Avoid_: Pet

**Animal Type**: A category of animal (e.g. dog, cat) that determines which Vaccinations, Medical Tests and Field Definitions apply to animals of that type, and the default Contract Template.
_Avoid_: Species, Category, Kind

**Vaccination**: A vaccination type that can be recorded for an Animal. Vaccinations are defined per Animal Type and linked to Animals with a date (`vaccinated_at`).
_Avoid_: Health condition, Vaccine record

**Medical Test**: A sickness or health test type that can be recorded for an Animal. Medical Tests are defined per Animal Type and linked to Animals with a date (`tested_at`) and a result.
_Avoid_: Health condition, Test result, Lab result

### Adoption process

**Adoption**: The complete process of finding and confirming a new owner for an Animal, beginning with an application and ending with a successful Handover or Cancellation.
_Avoid_: Transfer, Placement, Case

**Adoption Status**: The lifecycle state of an Adoption — `pending`, `in_progress`, `canceled`, or `done`.
_Avoid_: State, Phase

**Step**: One of the fixed stages of an Adoption — `application`, `pre_inspection`, `contract`, `transport`, `handover`. Owned by code, not configurable; optional and not enforced in order. Their nominal order is used only for data requirements.
_Avoid_: Phase, Stage, Milestone

**Inspection**: The general concept of a visit or video call in which an Inspector checks an Applicant's or Adopter's home. Not a model on its own — always use the specific kind (Pre-Inspection, Follow-up Inspection) in code and docs.
_Avoid_: Home check, Visit, Assessment

**Memo**: The Inspector's free-text notes on a Pre-Inspection, including mismatches with the Case File. Internal — never shown to the Applicant.
_Avoid_: Report, Inspection notes

**Pre-Inspection**: An Inspection before the Adoption is finalized, checking whether the home suits the Animal of that specific Adoption. Belongs to the Adoption; consists of a Verdict and a Memo. Also the name of the Step in which the Mediator decides — based on Pre-Inspections, a home video, earlier Pre-Inspections of the same Person, or none of these. Deliberately never shortened to "Inspection" in code and docs, to stay distinct from Follow-up Inspections.
_Avoid_: Pre-check (outside informal speech)

**Follow-up Inspection**: An Inspection conducted after a successful Handover to verify the Animal is thriving. Does not change the Adoption status.
_Avoid_: Post-adoption check

**Verdict**: The Inspector's recommendation on whether an Applicant should proceed with the adoption — either approved or rejected. Provided at the end of an Inspection.
_Avoid_: Decision, Result, Outcome, Assessment

**Contract**: The Schutzvertrag signed by both the Adopter and the Mediator, defining the rights and responsibilities of the adoption.
_Avoid_: Agreement, Document, Schutzvertrag (outside German UI strings)

**Transport**: A logistics entity that moves one or more Animals toward their Adopters. Multiple Adoptions can be assigned to the same Transport.
_Avoid_: Shipment, Delivery run

**Handover**: The moment the Animal is physically transferred to the Adopter. Completing a Handover transitions the Adoption to status `done` and the Applicant becomes an Adopter.
_Avoid_: Transfer, Delivery, Pickup

**Contract Template**: A configured contract: title, wording and three data sections (animal, mediator, adopter) of fields. An Animal Type can have several; the Mediator picks one at generation. The fields printed by an Animal Type's templates are required for the contract Step. See ADR-016.
_Avoid_: Contract layout, Contract form

### Form templates (under review — see docs/features/form-templates.md)

**Form Template**: A reusable, versioned schema that defines the structure of a dynamic form. Its use for pre-inspections is removed; whether it stays for animal custom fields is open.
_Avoid_: Form schema, Form definition, Form type

**Form Template Version**: A snapshot of a Form Template's schema at a specific point in time. A new Version is created automatically when a breaking schema change is made and the current Version already has Submissions.
_Avoid_: Schema version, Template revision, Form version

**Form Submission**: The data a user submitted against a specific Form Template Version, pinned to that Version.
_Avoid_: Form response, Form data, Form entry

### Case File

**Case File**: Everything an Adoption knows about *if and how* it can happen — the Field Values of that Adoption plus the Applicant's Built-in Fields. German UI: *Angaben*.
_Avoid_: Application data, Applicant data, Dossier

**Field Definition**: One configurable field of the Case File catalogue: key, type, Field Group, `collect_at`, `required_for`, review and visibility flags, Animal Types, an optional Condition.
_Avoid_: Custom field, Form field, Attribute

**Built-in Field**: A Field Definition backed by a Person column (name, email, address, …). Configurable like any field, but not deletable; its value is stored on the Person.
_Avoid_: System field, Standard field

**Condition**: A Field Definition's single rule that it only applies when an earlier boolean/select/radio field has a given value. A field whose Condition is not met doesn't apply: not asked, not required, not shown.
_Avoid_: Rule, Dependency, Logic

**Field Group**: A titled section that orders Field Definitions and Info Blocks. Groups decide *where* a field appears; `collect_at`/`required_for` decide *when*.
_Avoid_: Section, Page, Tab

**Info Block**: Informative text placed inside a Field Group. Collects no data.
_Avoid_: Heading field, Hint field

**Field Value**: The current value of one Field Definition for one Adoption, with its review status. History lives in the Audit Trail.
_Avoid_: Answer, Submission, Entry

**Review**: A Mediator's confirmation (or rejection with a note) of a Field Value whose definition requires it, e.g. the photo of a Sicherheitsgeschirr.
_Avoid_: Verification, Approval

**Requirement Override**: A Mediator's per-Adoption change to when a field is required — require it, waive it or move its Step.
_Avoid_: Exception, Custom requirement

**Requested Step**: How far data collection has been opened to the Applicant for an Adoption. Determines which fields the request form and the portal show.
_Avoid_: Current step, Stage

**Checklist**: The derived list of what is missing or awaiting Review for a Step of an Adoption, aggregated per Transport.
_Avoid_: Todo list, Requirements list

**Audit Trail**: The recorded history of changes to Animals, Persons, Adoptions and their Case Files — who, what, when, old and new value. Distinct from the contract signing audit events.
_Avoid_: Changelog, History, Activity log

**Applicant Portal**: The page where an Applicant, logged in by email and Magic Link, follows their Adoptions and sees and edits their Case File.
_Avoid_: Customer portal, Applicant login

**Magic Link**: A single-use, short-lived emailed link that logs a Person into the Applicant Portal or confirms an application. No password, no account.
_Avoid_: Login link, Token link

**Unconfirmed Application**: An Adoption from the public form whose email has not been confirmed yet. Has no Applicant; its identity data waits in a pending payload.
_Avoid_: Draft, Lead
