# Frontend — UI Context

The admin SPA, the form builder, the field catalogue editor and the token pages (pre-inspection, contract signing, applicant portal). Domain concepts (Animal, Person, Adoption, Case File, Field Definition, etc.) are defined in [api/CONTEXT.md](../api/CONTEXT.md); this context adds vocabulary specific to the frontend UI layer.

## Language

### Case File UI

**Field Type**: The kind of input element of a Field Definition — one of: text, textarea, number, integer, boolean, select, radio, date, email, phone, photo, video, document, and the layout type info (an Info Block).
_Avoid_: Field kind, Input type, Widget type

**Catalogue Editor**: The settings screen where Field Groups, Field Definitions and Info Blocks are created and ordered. Can reuse the form builder's per-type registry (`field-types/`).
_Avoid_: Field builder

**Applicant Case File Form**: The form the Applicant fills in — on the Application page and in the Applicant Portal — generated from the catalogue: one card per Field Group, live Conditions, server errors mapped to their fields (`ApplicantCaseFileForm`).
_Avoid_: Dynamic form, Wizard

**Requirement Text**: The short note under an applicant-facing field: *Pflicht* when it is needed for the Current Step, *Nötig für: Vertrag* when it is asked early but needed later (`applicantRequirement()`).
_Avoid_: Required badge

**Request Form** *(planned)*: A form generated from the catalogue for one Requested Step, containing exactly the fields the Applicant still has to provide.
_Avoid_: Dynamic form, Wizard

**Step Timeline**: The Applicant Portal's list of the five Steps with a simple status each.
_Avoid_: Progress bar

**Section Navigation**: The jump list of Field Groups on the adoption page, used for long Case Files.
_Avoid_: Table of contents, Tabs

### Public pages

**Applicant Pages**: The public pages under `/apply` and `/adopter` — the Application, the confirmation and login link pages, and the Applicant Portal. They live in `src/public/module/applicant/` and authenticate with the Applicant Session's bearer token, never with the admin session.
_Avoid_: Customer area

**Link Action Page**: A page an emailed link opens, with one button that uses the token up (confirming an Application, logging in). Opening the page alone never consumes it.
_Avoid_: Landing page

### Form builder (under review — see docs/features/form-templates.md)

**Heading Field**: A layout-only Field Type of a Form Template that renders as a section separator. It carries no validation rules and produces no data in a Form Submission.
_Avoid_: Section header, Divider field

**Schema**: The JSON Schema document within a Form Template Version that defines field names, types, and validation rules.
_Avoid_: Validation schema, Form schema (when "Schema" alone is unambiguous in context)

**UI Schema**: The companion document within a Form Template Version that defines how fields are displayed — labels, widget types, field order, and option labels.
_Avoid_: Display schema, Presentation schema
