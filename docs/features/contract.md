# Contract

The contract step is part of the adoption process. Once the mediator is satisfied with the pre-inspection result and wants to move forward, a Schutzvertrag (protection contract) must be signed by both the adopter and the mediator before the animal is handed over.

## What the Contract Covers

The Schutzvertrag defines the rights and responsibilities of both parties. It ensures the adopter commits to providing a suitable home and allows the organisation to verify this. The exact content depends on the organisation's template.

## Process

### Simple Version (current)

In the simple version, the contract is handled outside of Taily:

1. The mediator prepares and sends the contract to the adopter through their own channels.
2. Once the mediator has confirmation that both parties have signed, they mark the contract as signed in Taily.
3. Optionally, the signed document can be uploaded and stored alongside the adoption record.

The contract step is considered done when it is marked as signed.

### Advanced Version (planned)

Generation and signing are both handled natively in Taily, in PHP, targeting the SES (Simple Electronic Signature) eIDAS tier — no external document tool is used. See [ADR-012](../ADRs/ADR-012-contract-generation-and-signing.md) for the full reasoning and the legal questions this decision accepts as risk rather than as a legally confirmed answer, and [ADR-013](../ADRs/ADR-013-contract-template-rendering.md) for how templates are authored and rendered to PDF.

The Advanced Version does not replace the Simple Version — both exist side by side, chosen **per adoption**, not as a global instance setting. A mediator can start the automated flow for one adoption and handle another entirely by hand, and can drop out of the automated flow back to manual handling at any point before it completes (see [Escape to manual handling](#escape-to-manual-handling) below).

#### Flow

1. **Generate.** The mediator picks which contract template to use (Taily supports several at once — see [ADR-013](../ADRs/ADR-013-contract-template-rendering.md#decision) — e.g. one per animal type, or a variant for a specific situation; there's no auto-suggestion in this first version, the mediator always chooses explicitly) and triggers generation from the adoption. Taily renders that template with the animal's, adopter's, mediator's, and organization's data filled in, producing an unsigned PDF. This unsigned PDF is preserved unchanged for the rest of the flow: it is what both parties review, and at [Completion](#completion) its pages are carried into the final document rather than re-rendered from the template — see [Document integrity](#document-integrity).
2. **Choose a path.** With the unsigned PDF in hand, the mediator either:
   - downloads it and handles signing entirely outside Taily, then comes back and uploads the (now-signed) document and marks the contract signed — i.e. the [Simple Version](#simple-version-current)'s two actions, just seeded with a Taily-generated PDF instead of one authored elsewhere; or
   - starts the native signing process (next step).
3. **Mediator signs.** The mediator receives an email with a signed, single-purpose link (same token mechanism as the [pre-inspection public link](./pre-inspection.md), hardened further — see [Access and security](#access-and-security)). Opening it shows a review page presenting the unsigned PDF as generated in step 1. After reviewing, the mediator types their full name and checks a set of consent checkboxes (see [Signature capture](#signature-capture)) and submits. This is recorded as a signing event in the audit trail — see [Audit trail](#audit-trail).

   The mediator goes through this same token-link flow rather than signing from an authenticated admin session, even though they already have a Taily account — see [Why the mediator signs the same way as the adopter](#why-the-mediator-signs-the-same-way-as-the-adopter).
4. **Adopter signs.** Once the mediator has signed, the adopter receives the equivalent email and link. Their review page shows the same frozen PDF from step 1, plus the audit information recorded for the mediator's signature (who signed, when, and that they did). The adopter goes through the identical typed-name-and-checkboxes flow.
5. **Completion.** Once the adopter submits, Taily takes the frozen PDF from step 1 — the exact document both parties reviewed — and appends a signature-and-audit-trail appendix to it: both typed signatures with their timestamps and consent boxes, the hash of the contract document itself, and a certificate-of-completion-style audit trail (see [Audit trail](#audit-trail)). The contract body is never re-rendered; its pages are carried over unchanged, so neither a template edit nor a change to the adoption's data between generation and signing can alter what was agreed to. Before the appendix is attached, the frozen document is re-hashed and checked against the value recorded at generation — a mismatch aborts completion rather than producing a contract Taily can't vouch for. The result is a single PDF, not the original plus a separate file, and it is stored as the adoption's signed contract. All participants (mediator and adopter) are notified by email with a link to download it. The contract step is marked done — same end state as the Simple Version reaching "signed", just reached automatically.

   Because the contract body is generated before anyone has signed, it carries blank signature lines and the signatures appear on the appended page instead of inline beneath the contract text. That is a deliberate trade — a slightly worse-looking document in exchange for being able to prove the pages that were signed are the pages that were delivered — and it is the same shape DocuSign, Yousign and DocuSeal produce. See [ADR-013](../ADRs/ADR-013-contract-template-rendering.md).

At any point before step 5, the mediator can cancel — see [Cancellation](#cancellation).

#### Escape to manual handling

The Advanced Version's "Generate" step and the Simple Version's "mark signed" / "upload document" actions are not mutually exclusive paths chosen once — they're independent actions on the same adoption record. A mediator can generate a PDF via the Advanced flow and then never touch the native signing process at all, treating the generated PDF purely as a head start on the Simple Version's manual process. This is the intended, unremarkable case, not a fallback for something going wrong.

#### Why the mediator signs the same way as the adopter

The mediator could, in principle, just click a "sign" button in the admin UI, since they're already authenticated. That was considered and rejected: it would give the mediator's signature a different evidentiary shape from the adopter's (an authenticated-session action vs. a token-link-and-review action), which is exactly the kind of asymmetry an audit trail is meant to avoid. Requiring the same token-link-and-review path for both signers means the audit log format, the review-then-sign UX, and the evidentiary claim ("this person was shown this exact document and affirmatively signed it") are identical for both parties, and the code has no signer-type-specific signing path to maintain.

#### Signature capture

No canvas-drawn signature. Both mediator and adopter sign by typing their full name and checking a small set of explicit checkboxes: accept the contract's content, accept the data protection policy, and confirm the entered information is correct. This is a UX decision, not a legal one — SES does not require a drawn mark (see [ADR-012](../ADRs/ADR-012-contract-generation-and-signing.md#constraint-3-legal-signature-level)). The printed/paper rendering of the contract (e.g. for the Simple Version, or a mediator who downloads and prints) uses whatever is simplest — a signature line with a printed name — since it isn't part of the native signing evidentiary chain at all.

#### Audit trail

Every step of the native flow is recorded, not just the final "signed" state:

- Link generated (which token, issued to whom — mediator or adopter — and when)
- Email submitted to the mail transport (timestamp) — only written once the send has actually succeeded, never beforehand, so the trail can't claim a submission that didn't happen; this confirms handoff to the configured mail transport, not that the message reached the recipient's mailbox
- Link opened (first-view timestamp, IP address, user agent) — tracked separately from signing, since "had the opportunity to review" and "actually signed" are distinct evidentiary facts
- Signature submitted (timestamp, IP address, user agent, typed name entered, which checkboxes were checked, and a hash of the exact document being signed — the same `unsigned_document_hash` recorded at generation, so every signature event identifies a specific document rather than merely asserting that someone signed something)
- Cancellation, if it happens (who cancelled and when)

Every signer-tied event snapshots that signer's name and email at the moment the event is written, rather than resolving them live from the current `Person` record when the trail is later displayed. If an applicant's or mediator's name or email changes after their contract was sent, the trail keeps showing what was actually true at the time of each event instead of silently rewriting history; older rows written before this snapshot existed simply fall back to a live lookup. Internally-triggered events — starting a process, cancelling, resending an invite — also record which authenticated `User` performed the action plus their IP and user agent, the same evidentiary detail already captured for the public token-link events (link opened, signature submitted); a cancellation additionally records the Person on whose authority it was authorized (the adoption's mediator), which is distinct from the acting `User`.

The raw log is the source of truth, but it isn't the artifact a mediator or adopter should have to read to understand what happened — a human-readable "certificate of completion" (both signers, their timestamps, origin details) is rendered as its own page(s) *inside* the final signed PDF itself, appended after the signature block, rather than as a separate file — matching the pattern most established e-signature tools (DocuSign, Yousign, DocuSeal) already use, just folded into one document instead of two. This should be visible to Taily admins, and is also sent to the adopter — they reasonably expect a copy of what they legally committed to, not just the mediator.

Hash-chaining the audit log rows themselves (each row committing to the previous one, so a tampered or deleted row would be detectable) was considered and ruled out as unnecessary for now — the existing document-hash tamper-evidence on the final PDF (see [Document integrity](#document-integrity)) is sufficient. How long `link_opened` events should be retained, and whether every open (not just the first) is worth logging, stays out of scope here — orthogonal to what's captured.

#### Access and security

Same token pattern as the [pre-inspection public link](./pre-inspection.md), hardened further given what a contract token grants access to: legally binding, highly personal data, not just a read-only view. This means stronger entropy, an expiry window (see [Reminders and expiry](#reminders-and-expiry)), brute-force protection (rate limiting and/or lockout), explicit revocation (covered by [Cancellation](#cancellation)), and single-use enforcement so a token can't sign twice or be replayed after the contract is already complete.

- **Token storage and comparison** — `AccessToken` (shared by the contract and pre-inspection flows via `HasAccessToken`) stores a SHA-256 `token_hash` for indexed, no-table-scan lookup, plus a `token_ciphertext` (Laravel `Crypt::encryptString`) rather than the raw token. A one-way hash alone isn't enough: `ProcessContractSigningReminders` resends the same link days later, and the pre-inspection admin UI exposes a persistent "copy link" action — both need the plaintext recoverable well after issuance, which only encryption (not hashing) allows.
- **Leakage via the channel, not just the endpoint** — no third-party resources are loaded by the signing/inspection pages, and a `Referrer-Policy: strict-origin-when-cross-origin` header is set globally so a token can't leak via `Referer`.
- **IDOR-style checks** — the token is the sole lookup key for both flows, with no separate ID parameter.
- **Rate limiting on both reads and writes** — both `/contracts/{token}*` and `/inspect/{token}*` are throttled per-token and per-IP.
- **Error responses must not leak information** — invalid, expired, and already-used tokens return the same generic response for both flows.
- **CSRF protection without a session** — the public signing/inspection pages sit behind Sanctum's `EnsureFrontendRequestsAreStateful` (the same mechanism the authenticated SPA uses), so the same double-submit-cookie CSRF check the SPA relies on applies to the submit routes too.

This was worked through against a known checklist as an internal hardening pass (see [issue #159](https://github.com/ulbrich-media/taily/issues/159)), not a substitute for an external security audit.

#### Cancellation

The mediator can cancel the native signing process at any point before completion (i.e. any time after "Generate" and before the adopter's signature completes it). Cancelling is a full reset, not a pause:

- Any outstanding token (mediator's or adopter's) is immediately invalidated.
- Whoever had a pending action is notified by email that the process was cancelled.
- Resuming means starting over — generating fresh links (reusing the already-generated unsigned PDF, no need to re-render it) — or falling back to manual handling per [Escape to manual handling](#escape-to-manual-handling).

A full reset was chosen over a resumable pause to avoid a signature or token sitting in an indefinite "pending resume" state, and to keep the audit trail's state machine simple: a cancelled attempt is a closed, dead-end record, not something that can be silently reopened later.

Only the mediator can cancel — there is no separate adopter-facing "decline" action. Communication between mediator and adopter about anything wrong with the contract itself happens outside Taily, same as the rest of the adoption process; if the adopter has a problem with the contract, that gets resolved through whatever channel they already use, and the mediator is the one who acts on it in Taily — cancel, adjust (a new template, corrected data, or a manually handled document instead), and restart. A distinct in-app decline path for the adopter would duplicate a communication channel Taily doesn't otherwise provide.

#### Document integrity

Once signing completes, the final document must not change. In practice: a content hash is stored at the moment the final document is assembled, and that hash is what the audit trail refers back to. This detects tampering after the fact (a changed file no longer matches its recorded hash) rather than preventing it outright — nothing can stop someone with direct server or database access from altering a file or a row, and no realistic native solution can promise otherwise. What the hash gives is a way to notice and prove that something changed, which is the same standard most non-QES e-signature evidence relies on.

The original unsigned PDF from [Generate](#flow) is also kept alongside the final signed one, rather than being discarded once the final artifact exists. It is not a passive archive: it *is* the contract body of the final document, since completion appends to it rather than re-rendering (see step 5 above), and it is re-hashed and verified against `unsigned_document_hash` immediately before that append. FPDI carries each page over as an embedded form XObject, so the contract pages' content streams in the final PDF are byte-identical to the ones that were signed.

Note that this does not make the two files byte-identical: appending pages shifts every cross-reference offset, so `final_document_hash` and `unsigned_document_hash` necessarily differ. The guarantee is about the page content, not the file container. Comparing the two documents remains possible at any time, and now needs no trust in the renderer having behaved consistently — the input to the comparison was never re-derived.

#### Notifications

Every step that requires action or represents a change sends an email to whoever needs to know:

- Mediator: link to sign (step 3), cancellation notice (if the mediator cancelled while the adopter's link was outstanding — see [Cancellation](#cancellation)), a notice when the adopter's signing window expires unused (see [Reminders and expiry](#reminders-and-expiry)), completion notice with the final document.
- Adopter: link to sign (step 4, only sent once the mediator has signed), cancellation notice (if cancelled before their turn), a reminder before their own link expires, completion notice with the final document.

#### Reminders and expiry

Each signing link — mediator's or adopter's — is valid for **2 weeks** from when it's sent. Two reminder emails go to whoever hasn't yet signed: one after the first week (one week left), and one two days before expiry. If the window closes with no signature, the link is invalidated and the mediator is notified so they can decide what to do next — resend a fresh link (reusing the already-generated unsigned PDF, no need to regenerate it) or fall back to manual handling per [Escape to manual handling](#escape-to-manual-handling). This is deliberately the same "restart" shape as [Cancellation](#cancellation) rather than a separate state, since from the process's point of view an expired link and a cancelled one both mean "this attempt is dead, the mediator decides what happens next."

#### Relevant factors

- **Hosting.** Taily targets plain PHP shared hosting with no Node.js, Docker, or background worker infrastructure required (see [release-architecture.md](../release-architecture.md)). This rules out *running* a Node runtime, headless Chrome, or any other always-on service at request time as part of the default path — but not *calling* one: a plain outbound HTTP request from Taily's PHP process to an external API (a SaaS vendor, or a DocuSeal instance hosted elsewhere) is no different from any other third-party integration and stays shared-hosting compatible. Only self-hosting such a tool alongside Taily becomes an opt-in for operators already running extra infrastructure, not the baseline.
- **Cost and data protection.** Contracts carry the same personal data as the rest of an adoption plus, once signed, legally binding proof of identity. Third-party tools raise two questions per organization: recurring cost on top of a free/open-source product, and a data processing agreement covering the vendor's own retention policy, sub-processors, and hosting region.
- **Legal signature level.** eIDAS defines three tiers — SES, AES, QES — with increasing evidentiary weight and increasing technical requirements (SES is buildable in-house; AES/QES realistically require a trust-service integration). Taily targets SES; this is accepted without a binding legal confirmation (see [ADR-012](../ADRs/ADR-012-contract-generation-and-signing.md#legal-questions-and-accepted-risk)), on the basis that it is not legally weaker than the outside-Taily status quo and no indicator has surfaced that a higher tier is needed.

#### Customization and other accepted scope decisions

- **Customization** — contract templates are Blade views, overridable per Laravel's standard package-view convention, not a DB-stored/versioned schema like [form templates](./form-templates.md) — see [ADR-013](../ADRs/ADR-013-contract-template-rendering.md) for the full reasoning, including why this doesn't need form-templates-style version pinning. An external tool with a ready-made non-technical template editor (e.g. DocuSeal) was considered but is deferred — it requires a second, non-PHP service, which conflicts with the self-hosted, fully-contained distribution model — see [ADR-012](../ADRs/ADR-012-contract-generation-and-signing.md#docuseal-as-a-combined-generation-customization-and-signing-option). It may be added later as an optional integration. Contract templates carry only the contract itself — a plain signature line, no signature-block logic and no audit-trail include — because signatures and the audit trail are appended afterwards as separate pages rather than rendered into the body (see [ADR-013](../ADRs/ADR-013-contract-template-rendering.md)). The appendix has its own template, `contracts/signature-appendix.blade.php`, overridable by the same package-view convention. This means the same contract template works unchanged for both the Simple and the Advanced Version.
- **PDF output** — the end artifact is a PDF regardless of which path is chosen; see [ADR-013](../ADRs/ADR-013-contract-template-rendering.md) for the rendering library.
- **No withdrawal-right (Widerrufsrecht) handling.** Same as the status quo — not implemented, on the basis that there is no indicator this organization needs to support it. See [ADR-012](../ADRs/ADR-012-contract-generation-and-signing.md#legal-questions-and-accepted-risk) for the accepted risk this carries.
- **GDPR deletion/retention** is out of scope of the application for now, though the feature will integrate with a future deletion workflow once one exists — see [ADR-012](../ADRs/ADR-012-contract-generation-and-signing.md#legal-questions-and-accepted-risk).
