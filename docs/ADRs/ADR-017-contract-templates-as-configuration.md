# ADR-017: Contract Templates as Configuration

## Status

Proposed — supersedes the template-authoring parts of [ADR-013](ADR-013-contract-template-rendering.md). Prototyped on `prototype/adoption-based-structure`, with the amendments under [Prototype notes](#prototype-notes).

## Context

[ADR-013](ADR-013-contract-template-rendering.md) made contract templates Blade views registered in `config('taily.contracts')`. Changing the wording, adding a field or rebranding requires editing a Blade file and redeploying — not something an organization admin can do from the UI. ADR-013 accepted that because the alternative it saw was a WYSIWYG prose-with-merge-fields editor (DocuSeal-like), which is real effort.

[ADR-016](ADR-016-adoption-case-file.md) introduces a configurable field catalogue for the adoption. That changes the picture: a contract is mostly a fixed frame, a block of wording, and three data sections — the animal, the mediator, the adopter — each showing a selection of known fields. Choosing those fields is the same kind of configuration as configuring the adoption itself. No layout editor is needed.

Two more problems this solves:

- **What does the contract need?** Today nothing tells Taily which data a template prints. The mediator has to check by hand that the adopter's address or date of birth is filled in before generating. Fields missing at generation simply render blank.
- **Custom fields in the contract.** An organization that adds an "Ausweisnummer" field wants it in the contract without touching Blade.

## Decision

**Contract templates are database records configured in the admin UI: a title, the contract wording as plain text, and three data sections, each an ordered list of field keys. One generic Blade view renders every template. Several templates can exist per animal type; the fields they print become requirements for the contract step of every adoption of that animal type.**

### Structure

```
contract_templates
  id, name                  admin label, e.g. "Schutzvertrag Hund"
  title                     printed title, e.g. "Schutzvertrag"
  animal_type_ids           types it is offered for (pivot)
  body                      contract wording (plain text; paragraphs and headings via Markdown)
  animal_fields             ordered list of field keys, e.g. ["animal.name", "animal.breed", "animal.tasso_id"]
  mediator_fields           e.g. ["mediator.full_name", "mediator.phone"]
  adopter_fields            e.g. ["adopter.full_name", "adopter.date_of_birth", "adopter.address", "id_card_number"]
  archived_at
```

The header and footer (logo, organization text) are configured once per installation in the contract settings, not per template, because the same frame is used for the signature appendix.

### The field registry

Each section picks from a **field registry** of everything the contract can print:

| Prefix | Source | Examples |
|---|---|---|
| `animal.*` | Built-in Animal columns | name, animal type, breed, color, date of birth, animal number, Tasso/Findefix ID, contract notes, photo |
| `mediator.*` | Built-in Person columns of the mediator | full name, email, phone, address |
| `adopter.*` | Built-in Person columns of the applicant | full name, date of birth, address, email, phone |
| *(no prefix)* | Case File Field Definitions | `id_card_number`, `living_space_sqm` |

Labels printed in the contract come from the registry (built-ins) or the Field Definition (custom fields).

### Rendering

- One generic view, `contracts/configured.blade.php`, extends `contracts/layout.blade.php` and renders: title, the three data sections as label/value tables, then the wording.
- Wording is rendered with `Str::markdown()` (league/commonmark ships with Laravel, so no new dependency), with HTML input disabled.
- **No placeholders in the wording.** The data sections carry all variable content. An organization that wants "…das Tier {{ name }}…" inline overrides `contracts/configured.blade.php` via the package-view convention from ADR-013. That is the escape hatch for anything the configuration can't do.
- Everything after rendering is unchanged from ADR-013 and [features/contract.md](../features/contract.md): rendered once to PDF, frozen, hashed, signature appendix appended with FPDI.

### Several templates, requirements per animal type

An organization can have several templates per animal type — e.g. a standard Schutzvertrag and a variant for a specific situation. As today, the mediator picks the template **at generation**; nothing is chosen in advance on the adoption.

The contract requirements are therefore derived from the **animal type**, not from a chosen template: every field printed by any active template of the animal's type is **required for the contract step**, in addition to the catalogue's own `required_for` settings and the adoption's overrides. This includes animal and mediator fields: "Tasso-ID fehlt" appears on the checklist just like a missing adopter field.

This relies on an assumption: **the templates of one animal type print the same fields** — they differ in wording, not in data. If one variant printed an extra field, that field would become required for every adoption of that type. That is accepted, because variants in practice differ in their conditions, not in who the parties are. If it ever doesn't hold, the mediator can waive the field per adoption.

Contract generation is blocked while any field of the *chosen* template is missing, unless the mediator waived it for this adoption.

### Manual signing

Natively signed contracts carry no signature lines; signatures are appended as a separate page (see ADR-013). A mediator who wants to handle signing on paper — without going through the native process — downloads the generated contract **"zur manuellen Unterschrift"**: Taily appends a page with signature lines (place, date, signature for both parties) to the frozen PDF with FPDI, the same mechanism as the signature appendix. The frozen document itself stays unchanged, so the mediator can still start the native process afterwards. This replaces "copy the Blade template and add signature lines" from ADR-013, which configured templates can no longer do.

### No versioning

Editing a template does not need versioning, for the same reason given in ADR-013: the PDF is rendered once and the frozen artifact, not the template, is what gets signed and stored.

### Changes after generation

Applicants keep being able to edit their data through the portal. If they change a field that is part of a generated contract, the mediator's change notification says so explicitly ("changed after contract generation — the contract shows the old value"). There is no lock; see [ADR-016](ADR-016-adoption-case-file.md#lock-fields-once-they-are-in-a-generated-contract).

## Prototype notes

The prototype keeps the decision and settles some details:

- **Required or optional per field.** Each section entry is `{key, required}`. Only required entries become contract requirements and block generation; optional ones are printed when they have a value (a phone number, the animal's breed) and left out otherwise. Requiring every printed field made a template either too strict or too sparse.
- **Adopter fields are catalogue fields.** There is no `adopter.*` prefix: built-in Person fields are Field Definitions of every catalogue (`first_name`, `address`, …). A template may only print a catalogue field that exists in the catalogue of *every* animal type it is offered for, and such a field can't be archived while a template prints it.
- **Registry additions:** `animal.animal_type`, `animal.gender`, `animal.contract_notes`, `animal.photo` (printed beside the animal table) and `mediator.organization`.
- **Templates are archived, not deleted** — signing processes keep the template id in `template_key`.
- **Header and footer** still come from `contracts/layout.blade.php`; there are no contract settings yet. The manual-signing download isn't built yet either.
- The example Schutzvertrag is a seeded record (`ContractTemplateSeeder`), offered for every animal type.

## Consequences

### Positive

- Organizations change wording, sections and custom contract fields from the UI, without a deploy.
- Taily knows exactly which data each contract needs; incomplete contracts can no longer be generated by accident.
- A manually signable PDF is available for every template without template changes.
- One rendering path to maintain instead of one Blade file per template.
- The integrity chain from ADR-012/ADR-013 is untouched.

### Negative

- Layout freedom is limited to the fixed structure (frame, three sections, wording). Anything else needs a Blade override, which is a code change, as before.
- Contract wording becomes data that admins can edit. A careless edit changes legal text with no review step; the audit trail records who changed it.
- `config('taily.contracts')` and the shipped `default.blade.php` are replaced by a seeded default template record.
- Contract requirements assume that all templates of an animal type print the same fields; a template with extra fields makes them required for the whole animal type.

## Alternatives Considered

### Keep Blade templates (ADR-013)

Keeps full layout freedom, but every change needs a developer and Taily can't tell which fields a template uses. Kept only as the override escape hatch.

### Placeholders in the wording

Inline merge fields read more naturally, but they need a placeholder syntax, an editor that helps insert them, validation of unknown keys, and parsing to derive requirements. The three data sections cover the actual need. Dropped; possible through the Blade override.

### A contract template chosen in advance on the adoption

Each adoption would carry a `contract_template_id`, preset from the animal type, so requirements could come from exactly one template. Rejected: it adds a choice the mediator has to make (or correct) long before the contract, and the per-animal-type union gives the same result as long as templates of one type print the same fields.

### A visual layout editor

Free placement of fields on the page. The DocuSeal-like effort ADR-012/013 already ruled out, for no concrete need.
