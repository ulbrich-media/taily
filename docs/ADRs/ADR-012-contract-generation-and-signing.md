# ADR-012: Contract Generation and Signing Approach

## Status

Proposed

This ADR does not select a final solution. It lays out the decision space, the constraints that shape it, and a provisional leaning, so implementation work does not start from a blank page. See [To Check With Legal Counsel](#to-check-with-legal-counsel) and [Open Questions](#open-questions) for what still blocks turning this into an "Accepted" decision.

## Context

The Schutzvertrag (protection contract) is the step before an animal is handed over — see [features/contract.md](../features/contract.md). Today it is handled entirely outside Taily (the "Simple Version"): the mediator sends the contract through their own channels and marks it signed once confirmed. The "Advanced Version" already sketched in that doc — generate a pre-filled PDF, mediator signs, adopter signs, completed document is stored — is still the right shape. What is undetermined is *how* generation and signing are technically implemented.

Generation and signing are separable concerns. A generated PDF can be routed through a signing tool that had no part in producing it, and a signing workflow can accept a PDF from any source. Every option below should be evaluated on that axis independently — "custom PDF generation" does not imply "custom signing," and vice versa.

### Scope: jurisdiction

The automated/native flow this ADR designs targets **German law** (eIDAS as applied in Germany, plus BGB) for now — that is the jurisdiction of Taily's initial users and the only one being actively researched. Organizations operating under a different legal system are not blocked: they can keep using the Simple Version (contract handled entirely outside Taily, see [features/contract.md](../features/contract.md)), or adopt the Advanced Version and adjust the contract template and process to fit their own jurisdiction at their own risk. Generalizing the native flow to other jurisdictions (different signature-level rules, different consumer-protection regimes) is explicitly deferred until it is actually needed, not designed for speculatively now.

### Constraint 1: Hosting

Taily's distribution model (see [ADR-004](ADR-004-package-based-distribution.md) and [release-architecture.md](../release-architecture.md)) is built around running on plain PHP shared hosting with no Node.js, no Docker, and no background worker infrastructure required. This is a deliberate, load-bearing property of the project, not an incidental one — it is the difference between "upload via Composer to any €5/month hosting plan" and "provision and operate a second service."

Any solution that requires a Node.js runtime, a headless Chrome instance, or a separate always-on service at *request time* breaks that property. This does not rule out such tools outright, but it moves them from "the default" to "an optional, self-hosted-by-choice integration" — acceptable for an operator running Docker, unacceptable as what a shared-hosting operator needs by default.

This constraint applies to *running* a service, not to *calling* one. Taily's PHP process talking to an external HTTP API — whether that API is a SaaS vendor or an operator-hosted instance of an open-source tool — needs nothing beyond an HTTP client, the same as any other third-party integration already in the codebase. So a tool like DocuSeal (Ruby on Rails, needs its own Postgres/Redis/Docker) still can't run *inside* a shared-hosting Taily install, but a shared-hosting Taily install *can* still talk to a DocuSeal instance running elsewhere, or to DocuSeal's own hosted offering, via its [PHP API client](https://packagist.org/packages/docusealco/docuseal-php). That reframes such tools from "ruled out by hosting" to "ruled out only if self-hosting them is the chosen path" — see [DocuSeal as a combined option](#docuseal-as-a-combined-generation-customization-and-signing-option) below.

### Constraint 2: Cost and data protection

Contracts carry the same personal data as the rest of an adoption record (adopter name, address, animal details) plus, once signed, legally binding proof of identity and intent. Routing that through a third-party SaaS means:

- **Recurring cost** per club running an instance, on top of Taily being free/open-source — a meaningful adoption barrier for the small non-profits and clubs this project targets. (Each Taily install is single-tenant — the `Organization` model is just a free-text employer-style attribute a `Person` can have, not a tenant boundary — so this cost lands on the operator of the install, not per record in the database.)
- **A data processing agreement (DPA)** is required with whichever provider is used, and the provider's own sub-processors, retention periods, and hosting region all become Taily operators' compliance problem, not just the vendor's.
- **Self-hosted open-source alternatives** (e.g. Documenso, DocuSeal, OpenSign — see [Alternatives Considered](#e-signature--signing-workflow)) avoid the DPA and recurring-cost problems but reintroduce the hosting constraint: all three are Node.js or Ruby on Rails applications with their own database, meaning "self-hosted" here means *a second service to operate*, not "runs inside Taily's PHP process." Their hosted/cloud offerings (where available) fold back into the SaaS row above — cost and DPA apply again.

### Constraint 3: Legal signature level

eIDAS defines three tiers of electronic signature, each with different evidentiary weight and different technical requirements:

| Level | What it requires | Typical implementation |
|---|---|---|
| **SES** (Simple Electronic Signature) | Any data in electronic form attached to other data, used by the signer to sign — a low technical bar | Typed name + checkbox, click-to-sign, or a captured mark, tied to signer identity via a verified channel (e.g. emailed token link) |
| **AES** (Advanced Electronic Signature) | Uniquely linked to and capable of identifying the signer, created using means the signer can keep under their sole control, linked to the document such that any later change is detectable | Certificate-based signing, typically via a trust service provider |
| **QES** (Qualified Electronic Signature) | AES plus a qualified certificate issued by a qualified trust service provider and a qualified signature-creation device | Legally equivalent to a handwritten signature under eIDAS Art. 25(2); requires integration with a QTSP |

Current (non-legal) research suggests SES is sufficient for a Schutzvertrag — it is a private civil contract between an association and an adopter, not a category eIDAS or German law singles out for a higher tier. **This has not been legally confirmed** — see [To Check With Legal Counsel](#to-check-with-legal-counsel) — and it gates almost every other decision: SES is realistically buildable in-house in pure PHP; AES and QES both push strongly toward a trust-service integration (self-hosted or SaaS) since certificate issuance and qualified signature-creation devices are not something to build from scratch.

### What a custom (non-outsourced) solution would need

If generation and/or signing are built natively in Taily rather than delegated to a third party, the following are required regardless of which specific libraries are chosen:

- **Audit trail** — every step (generated, sent, viewed, signed by whom, when, from what IP/user agent) recorded immutably enough to serve as evidence if a signature is ever disputed. The raw log alone is not enough: the audit trail is the legally relevant artifact here, more so than the PDF itself, so it needs a human-readable presentation — a "Certificate of Completion"-style summary (who signed, when, from where, tied to the exact document hash) attached to or alongside the signed contract, not just rows in a database table. This should be explicitly accessible to Taily admins, and worth considering for adopters too (most established e-signature tools — DocuSign, Yousign, DocuSeal — surface this by default, and an adopter reasonably expects a copy of what they legally committed to, not just the mediator).
- **Signer access without an account** — adopters have no Taily login (see [data-scheme.md](../data-scheme.md#user)). Access must be a signed, single-purpose token, following the same pattern as the pre-inspection public link (see [features/pre-inspection.md](../features/pre-inspection.md)), but hardened further: a contract token grants access to legally binding, highly personal data, so it needs strong entropy, expiry, and brute-force protection (rate limiting, lockout, or both) beyond what the pre-inspection link currently has. Note also that the token is only as trustworthy as the channel it travels over — a plain, forwardable email link with no second factor. That is an accepted trade-off at SES level (SES does not require strong identity binding), but it should be a deliberate decision recorded here, not an implicit default nobody chose.
- **Signature capture** — still open whether a canvas-drawn signature is required, or whether a typed full name plus an explicit consent checkbox is enough. This is itself downstream of the legal signature level: SES does not mandate a drawn signature, so this is a UX decision more than a legal one if SES is confirmed sufficient.
- **Document integrity and storage** — once signed, the PDF must become immutable. This likely means storing a content hash at signing time and denying any further write to that media item, on top of the existing Spatie media library conventions used elsewhere (e.g. [ADR-006](ADR-006-public-media-serving.md)).
- **Retention vs. erasure** — a signed contract and its audit trail typically need to be retained for a legal defense period even after an adopter would otherwise be entitled to request erasure of their data (GDPR Art. 17(3)(e) carves out exactly this case, but the applicable retention period needs legal confirmation — see [To Check With Legal Counsel](#to-check-with-legal-counsel)). Taily has no GDPR anonymization/deletion workflow for `Person` records yet — building one is separate, future work — but whatever contract solution is chosen should not implicitly assume the `Person` record it points to will always exist unmodified. The `form_submissions` version-pinning pattern (see [features/form-templates.md](../features/form-templates.md#version-pinning)) is a plausible model: the signed document already freezes the data it contains once rendered, so this is mostly about making sure that assumption is explicit and doesn't quietly become false the day a deletion feature is added.
- **Security** — the combination of a token-accessible public endpoint and legally-binding, highly personal data is a materially higher-stakes target than the existing public media/pre-inspection endpoints. Needs explicit threat modeling before shipping, not an afterthought.
- **Customization** — Taily is open source with no legal counsel bundled in; organizations must be able to edit contract text, insert dynamic fields (animal name, adopter name, organization details, etc.), and swap in their own logo. This is close to a solved problem already: [features/form-templates.md](../features/form-templates.md) already provides versioned, schema-driven templates. Contract text is a different content shape (prose with embedded variables, not a data-collection form) but the versioning and template/version split are directly reusable. Building a good prose-with-merge-fields editor from scratch is real effort, though — this is the requirement where an external tool with an editor already built (see [DocuSeal](#docuseal-as-a-combined-generation-customization-and-signing-option) below) most plausibly beats a native build on cost-to-ship, at the price of the operator needing (or paying for) that external service.
- **PDF output** — the final artifact must be a PDF regardless of which path is chosen.

### DocuSeal as a combined generation, customization, and signing option

DocuSeal (MIT-licensed, Ruby on Rails/Vue, self-hosted via Docker or used as a paid cloud service) was initially scoped in this ADR only as a signing tool, in the same bucket as Documenso and OpenSign. Closer research shows it is meaningfully different from both, in a way that changes its position in this decision:

- **It generates the PDF, not just fills fields on one.** DocuSeal accepts HTML or DOCX as the source document — via its Web UI or its [HTML/DOCX API](https://www.docuseal.com/docs/api) — and renders that into the final PDF itself. Documenso and OpenSign, by contrast, both require an already-rendered PDF to be uploaded; they place signable fields on top of it but do not author the document's prose content. This means DocuSeal covers **generation and customization**, not just signing.
- **Customization happens in DocuSeal's own UI, not Taily's.** Contract text uses `{{Field Name}}` tags for signer-filled fields and `[[variable_name]]` tags for merge data Taily supplies at submission time (adopter name, animal name, organization details), edited through DocuSeal's WYSIWYG template builder. An organization could edit its Schutzvertrag wording and rebrand it without Taily needing to ship a prose-template editor at all — the exact gap the native path's Customization requirement above calls out as real effort to build.
- **A PHP API client exists** (`docusealco/docuseal-php`), so integration from Taily is a normal outbound HTTP integration, not a runtime dependency — consistent with the hosting-constraint nuance above. Whether the DocuSeal instance on the other end is self-hosted by the operator or DocuSeal's cloud is an operator choice, not a Taily architecture choice.
- **It still does not solve hosting for the *default* path.** An operator who wants this needs a DocuSeal instance somewhere — either paying for DocuSeal Cloud (reintroduces Constraint 2: recurring cost, DPA, US/EU hosting-region check needed) or running the Rails/Postgres/Redis stack themselves (reintroduces Constraint 1 for that operator, just as a second service rather than inside Taily). Neither of those is "install Taily on shared hosting and be done," so it still cannot be the only supported path.
- **Signature level:** DocuSeal's own audit trail and signing flow target SES/AES; QES would still need a QTSP integration on top, same as every other option here.

Net effect on this ADR: DocuSeal is the strongest *external* candidate, because it is the only one that collapses three separate requirements (generation, customization UI, signing + audit trail) into a single integration instead of three separate build efforts. It does not overturn the hosting-driven preference for a native default path, but it substantially changes the cost-benefit of the "optional integration" escape hatch mentioned in the Decision below — that escape hatch is worth prototyping specifically against DocuSeal first, rather than treated as a generic placeholder for "some signing API."

### Other third-party tools checked for the same generation capability

The user's question prompted a check of whether generation-from-source (not just field-placement-on-an-existing-PDF) is common among the alternatives already listed, or specific to DocuSeal:

- **Documenso** — no. Templates are built by uploading a PDF and positioning fields on it; there is no HTML/text authoring step. ([docs.documenso.com](https://docs.documenso.com/docs/users/templates/use))
- **OpenSign** — no. Same shape as Documenso: templates are existing PDFs with fields placed on them, not documents authored from text.
- **SaaS vendors (Yousign, Dropbox Sign, DocuSign, SignRequest, Skribble)** — mixed and generally not the focus of their product: these are signing platforms first. Some (e.g. DocuSign via its separate "Gen" product, PandaDoc as a distinct category of tool) offer document-generation add-ons, but that is a materially different product surface, usually a separate paid tier, and was not evaluated in depth here since the cost/DPA objection from Constraint 2 already applies to all of them regardless of this feature.

DocuSeal's PDF-from-HTML/DOCX generation is a genuine differentiator among the open-source options, not a feature every "e-signature tool" happens to share.

## Decision

No final decision yet — see [Open Questions](#open-questions). This section records the current leaning and the reasoning behind it, to be revisited once the open questions are answered.

**Leaning: build both generation and signing natively in Taily, in PHP, targeting SES.**

Reasoning:

- The hosting constraint is the strongest and clearest signal available today, and it rules out every Node/Rails-based tool (self-hosted open-source or otherwise) as the *default* path, without ruling them out as an optional integration for operators willing to run extra infrastructure.
- If SES is confirmed sufficient (Constraint 3), the remaining technical bar is realistic to build in pure PHP: a signed token, a form/consent capture page, a PHP PDF library, and an audit log table. None of this requires cryptographic certificate handling, which is where AES/QES would force a trust-service dependency.
- The customization requirement (editable contract text, dynamic fields, per-organization branding) is most naturally solved by extending the existing form-templates infrastructure rather than fighting a third-party tool's template system, which was never designed for prose documents — **with the caveat that [DocuSeal](#docuseal-as-a-combined-generation-customization-and-signing-option) is the one third-party option that *was* designed for exactly this**, and is the main reason this leaning is not yet a confident "Accepted."
- A native solution has no recurring per-organization cost and no DPA to negotiate for the default path — directly serving the free/open-source, small-non-profit target audience.

This leaning should not be read as closing the door on external tools: a lightweight integration point (send the merge data to an external tool instead of Taily's own generation/signing flow) is a reasonable escape hatch for operators who need AES/QES, want a more polished template-editing UI than Taily is likely to build natively, or simply prefer not to run the workflow themselves. Given the research above, that escape hatch should specifically target DocuSeal rather than a generic "some signing API" placeholder — it is the one option that also removes the customization-UI build effort, not just the signing effort. Whether it displaces the native path as the *primary* recommendation, rather than staying an optional escape hatch, is itself one of the [open questions](#open-questions).

### Consequences of this leaning

#### Positive

- No new runtime infrastructure requirement — stays within the existing "PHP on shared hosting" promise.
- No recurring cost or third-party DPA for the default path.
- Full control over data retention and deletion, which matters given how personal the data is.
- Reuses existing patterns (token-based public access from pre-inspections, versioned templates from form-templates, media conventions from ADR-006) instead of introducing new architectural concepts.
- Signing workflow stays swappable later — a custom-built flow does not preclude offering an external-tool integration as an alternative path for operators who need AES/QES.

#### Negative

- Taily takes on the liability and correctness burden of audit trail, token security, and document immutability itself, rather than delegating it to a specialist vendor whose whole business is getting this right.
- If legal review later determines AES or QES is required (or a specific jurisdiction Taily is deployed in demands it), this leaning is largely invalidated for the signing half — a trust-service integration would become mandatory, not optional.
- More implementation surface area (PDF rendering, token security, audit logging, immutability enforcement) than "connect to a signing API and store the callback."
- No independent, professional attestation of signature validity if it's ever legally contested — the audit trail is only as trustworthy as Taily's own implementation and record-keeping.

## Alternatives Considered

### PDF generation

| Option | Notes |
|---|---|
| **dompdf** | Pure PHP, no external binary, renders HTML/CSS to PDF. Weakest CSS support of the three PHP options (no flexbox/grid), but zero infrastructure — fits the hosting constraint exactly. Actively maintained, already the most common choice in the Laravel ecosystem (`barryvdh/laravel-dompdf`). |
| **mPDF** | Pure PHP, better CSS support than dompdf (including some flexbox), built-in UTF-8/RTL support. Slightly heavier and slower than dompdf. Also zero infrastructure. |
| **TCPDF** | Pure PHP, oldest and most battle-tested of the three, but API is lower-level (build the PDF procedurally rather than from HTML) — a worse fit given contract content should be edited as marked-up text, not PHP draw calls. |
| **Browsershot / headless Chrome** (`spatie/browsershot`) | Best-in-class HTML/CSS fidelity (real Chromium rendering), but requires Node.js and a Chrome/Chromium binary on the server at request time. Directly violates the hosting constraint for the default path; viable only as an opt-in for Docker-based operators. |
| **Hosted PDF-generation API** (e.g. DocRaptor, PDFShift, Api2Pdf) | Offloads rendering fidelity concerns entirely, no server infra. Reintroduces the cost/data-protection problem from Constraint 2 — contract content (personal data) would transit a third party purely to be rendered, which is a hard sell for the GDPR-sensitive data this feature handles. |
| **DocuSeal's HTML/DOCX-to-PDF generation** | Not a PHP library — an external service called over HTTP (see [DocuSeal as a combined option](#docuseal-as-a-combined-generation-customization-and-signing-option)). Listed here too because it is, technically, a generation option on its own: Taily could use DocuSeal purely to render the PDF and still handle signing natively. Unlikely to be worth splitting that way in practice — its value is bundling generation with customization and signing, not generation alone. |

Given the hosting constraint, dompdf or mPDF are the realistic default candidates for the native path; the choice between them is a second-order decision (CSS fidelity vs. maturity/speed) that does not need to block this ADR.

### E-signature / signing workflow

| Option | Notes |
|---|---|
| **Custom-built (token access + typed name/checkbox or canvas capture + audit log)** | See [What a custom solution would need](#what-a-custom-non-outsourced-solution-would-need) above. Realistic if SES is confirmed sufficient. No recurring cost, no new infrastructure, full data control. |
| **Self-hosted open source: Documenso** | AGPL, TypeScript/React/Prisma/PostgreSQL stack, supports SES/AES natively (QES needs a QTSP integration). Self-hosting avoids the DPA/cost problem but not the infrastructure problem — it is a separate Node service with its own database, not something that runs inside Taily's PHP process. |
| **Self-hosted or cloud: DocuSeal** | MIT-licensed, Ruby on Rails/Vue, Docker image, can run on SQLite for small deployments; also available as a paid cloud service. Unlike Documenso/OpenSign, also generates the PDF from HTML/DOCX with merge variables and a WYSIWYG template builder — covers customization, not just signing. Integrates via a first-party PHP API client, so no PHP-side runtime dependency. Self-hosting still doesn't solve hosting for the operator (a second service to provision); the cloud option reintroduces cost/DPA. See [DocuSeal as a combined option](#docuseal-as-a-combined-generation-customization-and-signing-option) for the full picture. |
| **Self-hosted open source: OpenSign** | AGPL, Node.js/React/MongoDB. Smaller feature set than the two above. Same infrastructure trade-off. |
| **SaaS: Yousign, SignRequest, Skribble, Dropbox Sign, DocuSign, etc.** | Fastest to integrate, offloads all audit-trail/legal correctness concerns to a specialist. Recurring cost per club running an instance, a DPA is required, and hosting region/sub-processor chain varies by vendor (Yousign and SignRequest are EU-based and market GDPR compliance explicitly; Dropbox Sign and DocuSign are US companies requiring SCCs). Directly reintroduces Constraint 2's cost and data-protection concerns as an ongoing operational burden for every Taily operator, not a one-time integration cost for the project. |

Self-hosted open-source signing tools sit in an unusual middle ground: they solve the cost and data-sovereignty problem SaaS has, but not the "no extra infrastructure" problem custom-built PHP has. They remain worth keeping as a documented *optional* integration for operators who are already running Docker and want a more feature-complete signing UI than Taily would build natively (templates, bulk sending, reminders) — just not as the default path a shared-hosting operator is pushed toward.

## To Check With Legal Counsel

This ADR deliberately stops short of legal conclusions. The following need an actual lawyer, scoped to [German law](#scope-jurisdiction), before this ADR can move from Proposed to Accepted:

1. **Is SES sufficient for a Schutzvertrag?** Current non-legal research (see [Constraint 3](#constraint-3-legal-signature-level)) suggests yes — it is a private civil contract, not a category eIDAS or German law singles out for a higher tier. This is the highest-leverage question: it determines whether a pure-PHP custom build is viable at all for signing, or whether a trust-service integration becomes mandatory.
2. **Does a Schutzvertrag need any particular form at all?** German contract law defaults to *Formfreiheit* — most contracts need no specific form to be binding unless a statute demands it. eIDAS tiers (SES/AES/QES) matter for substituting a *statutory or contractually agreed* written-form requirement (§126a BGB) and for evidentiary strength — not because a contract inherently needs "a signature" in the eIDAS sense. Worth asking directly: does a Schutzvertrag require Schriftform, Textform (§126b BGB — no signature needed, just text on a durable medium), or nothing at all? The answer reframes how much of the audit-trail/signature-capture rigor sketched in this ADR is legally load-bearing versus a deliberate choice for evidentiary weight and adopter trust.
3. **Does a statutory withdrawal right (Widerrufsrecht, §312g BGB) apply?** If the Schutzvertrag is concluded as a consumer contract via distance communication, the adopter may have a 14-day withdrawal right. If it applies, does that mean handover cannot happen immediately after signing, or does it require the org to obtain an explicit waiver of the withdrawal period first? This directly affects the process flow in [features/contract.md](../features/contract.md), not just the signing mechanism.
4. **What retention basis and duration apply to the signed contract and its audit trail?** GDPR Art. 17(3)(e) plausibly justifies retaining both past an erasure request (legal claims defense), but "plausibly" needs to become a confirmed retention period this ADR's data model can be built around — see the [Retention vs. erasure](#what-a-custom-non-outsourced-solution-would-need) requirement above.

## Open Questions

These are product/technical decisions, not legal ones, and can mostly be resolved independently of the legal counsel questions above (though question 1 below is downstream of legal-counsel question 1):

1. **Signature capture UX.** Assuming SES is confirmed: is a canvas-drawn signature a hard requirement (e.g. for the "feel" of signing something legally binding, even if not legally required), or is typed name + checkbox acceptable? This affects frontend scope more than backend architecture.
2. **Escape hatch scope.** If a native solution is built, should a DocuSeal integration point be designed in from the start (even if unimplemented), or deferred entirely until an operator actually needs it?
3. **DocuSeal evaluation.** Worth a hands-on spike before committing to the native path: self-host a DocuSeal instance, build a real Schutzvertrag template with its merge-field syntax, and integrate the PHP client end-to-end for one adoption. That would turn the reasoning above from research into a real cost comparison against building a native template editor, PDF renderer, and signing flow — and would surface DocuSeal's actual current pricing/hosting-region terms for its cloud tier, which were not verified in depth here.
