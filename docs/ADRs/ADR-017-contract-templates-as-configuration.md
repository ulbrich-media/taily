# ADR-017: Contract Templates as Configuration

## Status

Accepted — supersedes the template-authoring parts of [ADR-013](ADR-013-contract-template-rendering.md)

## Context

[ADR-013](ADR-013-contract-template-rendering.md) made contract templates Blade views registered in `config('taily.contracts')`. Changing the wording, adding a field or rebranding requires editing a Blade file and redeploying — not something an organization admin can do from the UI. ADR-013 accepted that because the alternative it saw was a WYSIWYG prose-with-merge-fields editor (DocuSeal-like), which is real effort.

[ADR-016](ADR-016-adoption-case-file.md) introduces a configurable field catalogue per animal type, which also holds the applicant's data. That changes the picture: a contract is mostly a fixed frame, a block of wording, and three data sections — the animal, the mediator, the adopter — each showing a selection of known fields. Choosing those fields is the same kind of configuration as configuring the adoption itself. No layout editor is needed.

Two more problems this solves:

- **What does the contract need?** Nothing tells Taily which data a template prints. The mediator has to check by hand that the adopter's address or date of birth is filled in before generating. Fields missing at generation simply render blank.
- **Custom fields in the contract.** An organization that adds an "Ausweisnummer" field wants it in the contract without touching Blade.

## Decision

**Contract templates are database records configured in the admin UI: a title, the contract wording as plain text, and three data sections, each an ordered list of fields marked required or optional. One generic Blade view renders every template. A template belongs to exactly one animal type, and an animal type can have several templates; the fields they require become requirements for the contract step of every adoption of that animal type.**

### Structure

```
contract_templates
  id
  animal_type_id            the one animal type it is for
  name                      admin label, e.g. "Schutzvertrag Hund"
  title                     printed title, e.g. "Schutzvertrag"
  body                      contract wording (plain text; paragraphs and headings via Markdown)
  animal_fields             ordered list of {key, required}, e.g. animal.name, animal.breed, animal.tasso_id
  mediator_fields           e.g. mediator.full_name, mediator.phone
  adopter_fields            e.g. first_name, last_name, date_of_birth, address, id_card_number
  archived_at
```

Each entry is `{key, required}`. Required entries become contract requirements and block generation; optional ones are printed when they have a value (a phone number, the animal's breed) and left out otherwise. Requiring every printed field would make a template either too strict or too sparse.

**One animal type per template.** Each animal type has its own Case File catalogue, so a template for one type can print exactly that type's fields. Sharing a template between types would limit its adopter fields to those every type has, and tie a change for dogs to the cats' contract. Keeping the same contract for two types means keeping two templates — little extra work for a rare need.

The header and footer (logo, organization text) are configured once per installation in the contract settings, not per template, because the same frame is used for the signature appendix.

### The fields a template can print

| Section | Source | Examples |
|---|---|---|
| Animal | Built-in Animal columns, from a field registry | name, animal type, gender, breed, color, date of birth, animal number, Tasso/Findefix ID, contract notes, photo (printed beside the table) |
| Mediator | Built-in Person columns of the mediator, from the registry | full name, organization, email, phone |
| Adopter | Field Definitions of the template's animal type catalogue: the built-in applicant fields and custom fields | `first_name`, `address`, `id_card_number`, `living_space_sqm` |

Labels printed in the contract come from the registry (animal, mediator) or the Field Definition (adopter). Files and Info Blocks can't be printed. A catalogue field can't be archived while a template prints it.

Registry keys carry their section as a prefix (`animal.date_of_birth`, `mediator.email`), adopter keys don't. The prefix is not redundant: the contract step's checklist and the generation check put all three sections into one list of keys next to the catalogue's own fields, and the same names exist on both sides — `date_of_birth` and `email` are applicant fields, `animal.date_of_birth` and `mediator.email` are not.

### Rendering

- One generic view, `contracts/configured.blade.php`, extends `contracts/layout.blade.php` and renders: title, the three data sections as label/value tables, then the wording.
- Wording is rendered with `Str::markdown()` (league/commonmark ships with Laravel, so no new dependency), with HTML input disabled.
- **No placeholders in the wording.** The data sections carry all variable content. An organization that wants "…das Tier {{ name }}…" inline overrides `contracts/configured.blade.php` via the package-view convention from ADR-013. That is the escape hatch for anything the configuration can't do.
- Everything after rendering is unchanged from ADR-013 and [features/contract.md](../features/contract.md): rendered once to PDF, frozen, hashed, signature appendix appended with FPDI.

### Several templates, requirements per animal type

An animal type can have several templates — e.g. a standard Schutzvertrag and a variant for a specific situation. The mediator picks the template **at generation**; nothing is chosen in advance on the adoption.

The contract requirements are therefore derived from the **animal type**, not from a chosen template: every field any active template of the animal's type marks as required is **required for the contract step**, in addition to the catalogue's own `required_for` settings and the adoption's overrides. This includes animal and mediator fields: "Tasso-ID fehlt" appears on the checklist just like a missing adopter field.

This relies on an assumption: **the templates of one animal type require the same fields** — they differ in wording, not in data. If one variant required an extra field, that field would become required for every adoption of that type. That is accepted, because variants in practice differ in their conditions, not in who the parties are. If it ever doesn't hold, the mediator can waive the field per adoption.

Contract generation is blocked while any required field of the *chosen* template is missing, unless the mediator waived it for this adoption.

### Archiving and the default template

Templates are archived, not deleted: signing processes keep the id of the template they were generated from in `template_key`. A new installation is seeded with an example Schutzvertrag for every animal type, replacing the shipped `default.blade.php`.

### Manual signing

Natively signed contracts carry no signature lines; signatures are appended as a separate page (see ADR-013). A mediator who wants to handle signing on paper — without going through the native process — downloads the generated contract **"zur manuellen Unterschrift"**: Taily appends a page with signature lines (place, date, signature for both parties) to the frozen PDF with FPDI, the same mechanism as the signature appendix. The frozen document itself stays unchanged, so the mediator can still start the native process afterwards. This replaces "copy the Blade template and add signature lines" from ADR-013, which configured templates can no longer do.

### No versioning

Editing a template does not need versioning, for the same reason given in ADR-013: the PDF is rendered once and the frozen artifact, not the template, is what gets signed and stored.

### Changes after generation

Applicants keep being able to edit their data through the portal. If they change a field that is part of a generated contract, the mediator's change notification says so explicitly ("changed after contract generation — the contract shows the old value"). There is no lock; see [ADR-016](ADR-016-adoption-case-file.md#lock-fields-once-they-are-in-a-generated-contract).

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
- Contract requirements assume that all templates of an animal type require the same fields; a template with extra required fields makes them required for the whole animal type.
- The same contract for several animal types is kept as one template per type; a wording change has to be made in each.

## Alternatives Considered

### Keep Blade templates (ADR-013)

Keeps full layout freedom, but every change needs a developer and Taily can't tell which fields a template uses. Kept only as the override escape hatch.

### Placeholders in the wording

Inline merge fields read more naturally, but they need a placeholder syntax, an editor that helps insert them, validation of unknown keys, and parsing to derive requirements. The three data sections cover the actual need. Dropped; possible through the Blade override.

### A template shared by several animal types

One template offered for several types would save keeping copies in sync. Rejected: its adopter fields would be limited to the fields every one of those catalogues has, and a field added for one type would change the others' contract. Sharing a contract across types is rare enough that a copy per type is the simpler rule.

### Unprefixed keys in every section

Since each section reads from one source, `animal.` and `mediator.` look redundant. Rejected because the keys of all sections meet in one place — the contract checklist next to the catalogue's fields — where `date_of_birth` or `email` would be ambiguous.

### A contract template chosen in advance on the adoption

Each adoption would carry a `contract_template_id`, preset from the animal type, so requirements could come from exactly one template. Rejected: it adds a choice the mediator has to make (or correct) long before the contract, and the per-animal-type union gives the same result as long as templates of one type require the same fields.

### A visual layout editor

Free placement of fields on the page. The DocuSeal-like effort ADR-012/013 already ruled out, for no concrete need.
