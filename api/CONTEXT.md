# API — Adoption Domain

The core domain: finding and confirming a new owner for an animal, from initial application through handover. All domain terms are defined here; the frontend context extends this vocabulary for UI-specific concepts.

## Language

### People

**Person**: Anyone relevant to the adoption process who can hold one or more roles (Mediator, Applicant/Adopter, Foster, Inspector).
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

**Animal Type**: A category of animal (e.g. dog, cat) that determines which Form Templates and Health Conditions apply to animals of that type.
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

**Inspection**: A visit or video call in which an Inspector evaluates whether an Applicant's home and living conditions are suitable for an Animal of a given Animal Type.
_Avoid_: Home check, Visit, Assessment

**Pre-Inspection**: The Inspection step within an Adoption that takes place before the Adoption is finalized. The Mediator decides if and when to trigger it.
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

### Form templates

**Form Template**: A reusable, versioned schema that defines the structure of a dynamic form. Templates are assigned to features (e.g. a Pre-Inspection for a specific Animal Type uses one Form Template).
_Avoid_: Form schema, Form definition, Form type

**Form Template Version**: A snapshot of a Form Template's schema at a specific point in time. A new Version is created automatically when a breaking schema change is made and the current Version already has Submissions.
_Avoid_: Schema version, Template revision, Form version

**Form Submission**: The data a user submitted against a specific Form Template Version. A Submission is permanently pinned to the Version that was active when it was first submitted.
_Avoid_: Form response, Form data, Form entry
