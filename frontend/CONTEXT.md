# Frontend — UI Context

The admin SPA and form builder. Domain concepts (Animal, Person, Adoption, etc.) are defined in [api/CONTEXT.md](../api/CONTEXT.md); this context adds vocabulary specific to the frontend UI layer.

## Language

### Form builder

**Field Type**: The kind of input element in a Form Template — one of: text, textarea, number, integer, checkbox, select, radio, date, email, phone, heading.
_Avoid_: Field kind, Input type, Widget type

**Heading Field**: A layout-only Field Type that renders as a section separator in a form. It carries no validation rules and produces no data in a Form Submission.
_Avoid_: Section header, Divider field

**Schema**: The JSON Schema document within a Form Template Version that defines field names, types, and validation rules.
_Avoid_: Validation schema, Form schema (when "Schema" alone is unambiguous in context)

**UI Schema**: The companion document within a Form Template Version that defines how fields are displayed — labels, widget types, field order, and option labels.
_Avoid_: Display schema, Presentation schema
