# ADR-019: Rich Text Editing with Tiptap

## Status

Accepted

## Context

Several long-form text fields need basic formatting (#332): contract templates, info texts on applications and the animal description (`publish_description`). Today they are plain `<Textarea>` inputs. The animal description already contains Markdown, but only the consuming website interprets it. Taily itself has no editor and no single format for formatted text.

The requirements are deliberately small:

- Basic formatting only: bold/italic, links, headings, paragraphs (and lists).
- The allowed formatting must be configurable per field (e.g. no headings in a short info text).
- The output format per field is not known yet. Contracts are rendered to PDF from HTML via dompdf, the public website consumes Markdown, emails or exports may need plain text, and other formats may follow.
- A well-maintained, simple package that fits the shadcn/Tailwind UI (ADR-003) rather than shipping its own look.

## Decision

Use **Tiptap 3** (ProseMirror-based, headless, MIT) as the rich text editor in the frontend, and **`ueberdosis/tiptap-php`** in the backend.

- **Storage format is Tiptap/ProseMirror JSON.** The structured document is the canonical value of a rich text field. It does not lose information, and every output format is a renderer over the same tree.
- **Outputs are rendered in the backend.** HTML via `tiptap-php` (`getHTML()`), plain text via `getText()`. Markdown and any future format are produced by small renderers that walk the JSON. With the restricted node set this is a few dozen lines per format.
- **Per-field configuration via extensions.** A shared `RichTextEditor` component receives the allowed features and builds the Tiptap extension list from them. The toolbar is built with our shadcn components. The backend uses the same allowed set when sanitizing with `tiptap-php`, so nodes and marks a field does not allow are dropped on save, regardless of what the client sends.
- **Markdown support in the editor.** `@tiptap/markdown` is included to import existing Markdown content (the animal description) and, if needed, to paste or export Markdown on the client.

Packages added:

- npm: `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/markdown`
- composer: `ueberdosis/tiptap-php`

## Consequences

### Positive

- One editor and one storage format for all formatted text in Taily.
- New output formats don't require migrating stored data, only a new renderer.
- The headless editor fits the existing shadcn UI instead of adding a second design language.
- Per-field restrictions are enforced on both sides (editor features and backend sanitizing).
- Actively maintained: Tiptap releases frequently, and `tiptap-php` is maintained by the same company.

### Negative

- Stored JSON cannot be read or edited directly in the database or by API consumers. They need a rendered format, which the API has to expose explicitly.
- Existing Markdown content (animal descriptions) needs a one-time conversion, and the public API must keep delivering Markdown to the website, now rendered from JSON.
- `tiptap-php` requires `spatie/shiki-php` and `scrivo/highlight.php` for code-block highlighting. We don't use them, but they are installed.
- Tiptap's open-source core is MIT, but some extensions and features (collaboration, AI, some UI templates) are paid. We must stay on the open-source extensions.
- A Markdown renderer has to be written and maintained in-house, because `tiptap-php` doesn't produce Markdown.

## Alternatives Considered

- **Tiptap with Markdown as the storage format**: no new PHP dependency (Laravel already includes `league/commonmark` for HTML output). Rejected because Markdown can't represent some formatting (e.g. underline), and every future format would have to be derived from Markdown instead of a structured tree.
- **Lexical (Meta)**: headless and actively maintained, but still pre-1.0, needs considerably more setup code for basic features, and has no PHP library for its document format.
- **MDXEditor**: built on Lexical and stores Markdown, but ships its own opinionated UI that conflicts with shadcn, and is heavier than needed for basic formatting.
- **Plain textarea with Markdown**: simplest, but not suitable for non-technical users editing contracts and info texts.
