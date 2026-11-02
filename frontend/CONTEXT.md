# Frontend — UI Context

The admin SPA, the form builder, the field catalogue editor and the token pages (pre-inspection, contract signing, applicant portal). Domain concepts (Animal, Person, Adoption, Case File, Field Definition, etc.) are defined in [api/CONTEXT.md](../api/CONTEXT.md); this context adds vocabulary specific to the frontend UI layer.

## Language

### Case File UI

**Field Type**: The kind of input element of a Field Definition — one of: text, textarea, number, integer, boolean, select, radio, date, email, phone, photo, video, document, and the layout type info (an Info Block).
_Avoid_: Field kind, Input type, Widget type

**Catalogue Editor**: The settings screen where Field Groups, Field Definitions and Info Blocks are created and ordered. Can reuse the form builder's per-type registry (`field-types/`).
_Avoid_: Field builder

**Request Form**: A form generated from the catalogue for one Requested Step, containing exactly the fields the Applicant still has to provide. The application form is the Request Form for `application`. Paginated by Field Group.
_Avoid_: Dynamic form, Wizard

**Section Navigation**: The jump list of Field Groups on the adoption page, used for long Case Files.
_Avoid_: Table of contents, Tabs

### Form builder (under review — see docs/features/form-templates.md)

**Heading Field**: A layout-only Field Type of a Form Template that renders as a section separator. It carries no validation rules and produces no data in a Form Submission.
_Avoid_: Section header, Divider field

**Schema**: The JSON Schema document within a Form Template Version that defines field names, types, and validation rules.
_Avoid_: Validation schema, Form schema (when "Schema" alone is unambiguous in context)

**UI Schema**: The companion document within a Form Template Version that defines how fields are displayed — labels, widget types, field order, and option labels.
_Avoid_: Display schema, Presentation schema
