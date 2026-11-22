# Pre-Inspection

A pre-inspection (German UI: *Vorkontrolle*) is a visit or video call in which an inspector checks whether the applicant's home and living conditions are suitable for **the animal of this adoption**. At the end, the inspector gives a verdict for or against the adoption; the mediator decides whether to proceed.

## Part of the adoption

A pre-inspection belongs to one adoption, and so to one animal. That matters, because a Chihuahua has different requirements than a Husky, even though both are dogs: the inspector sees the animal and exactly what the applicant sent in for it.

The flip side: a pre-inspection is not reused for the applicant's next adoption. Earlier pre-inspections of the same applicant — adoptions with the same email or the same referenced Person — are shown as a cross-reference on the adoption page (see [case-file.md](./case-file.md#second-adoption-by-the-same-applicant)), and the mediator can confirm the step based on them. A Person's page lists the pre-inspections of the adoptions that reference them or use their email.

## Verdict and memo

The inspector's job is to check what the applicant sent in, not to collect a second data set. So a pre-inspection has no form of its own, only:

- **Verdict** — approved / rejected (*geeignet* / *nicht geeignet*)
- **Memo** — free text for everything else, including mismatches

> **Example.** The applicant said 200 m². The inspector writes in the memo: *"Die 200 m² enthalten den Dachboden, der nicht bewohnbar ist. Tatsächlich ca. 120 m²."* The mediator reads the memo and corrects the field value.

Organizations whose inspectors gather information themselves can configure Case File fields hidden from the applicant, which the mediator fills from the memo. The inspector can't write those fields directly.

An adoption can have several pre-inspections (e.g. a second visit). The inspector's verdict is a recommendation. The step is closed by the mediator's confirmation on the adoption (see [adoption.md](./adoption.md#pre-inspection)).

## Process

1. The mediator creates a pre-inspection from the adoption's pre-inspection step, optionally assigning an inspector. It is shown under the adoption.
2. A pre-inspection-specific link becomes available, to copy or send to the inspector.
3. The link opens a public page showing the animal and the applicant's Case File — **only fields visible to the inspector**, in the catalogue's groups, read-only. Contract data like the Ausweisnummer stays hidden. Fields whose [condition](./case-file.md#conditional-fields) isn't met are left out.
4. The inspector submits verdict and memo. The link becomes invalid.
5. The mediator can edit verdict and memo in the admin at any time, and can delete a pre-inspection.

The memo and verdict are internal: visible to the inspector and the mediator, never to the applicant.

## Video instead of a pre-inspection

When finding an appointment is hard, or something in the application seems off, the mediator can require the **home video** for this adoption (a [Requirement Override](./case-file.md#requirement-overrides)). Based on the video, the mediator confirms the pre-inspection step without any pre-inspection record. Whether a pre-inspection, a video, both or neither is needed is decided case by case. Until file uploads exist, the applicant sends the video directly to the mediator.

## Naming: pre-inspection vs. follow-up inspection

The full name *pre-inspection* is deliberate, even though "inspection" is used in conversation. A **follow-up inspection** — e.g. a checkup a year after the adoption — would be a separate feature. Keeping the names distinct in code and docs (`PreInspection`, `pre_inspections`) avoids ambiguity once both exist. *Inspection* on its own is only the general concept of a visit or check.

## Planned

- **Files on the pre-inspection page** — uploaded files (home video, landlord confirmation) shown if their field is visible to the inspector, once [file fields](./case-file.md#planned) exist.
- **Audit trail** — a correction after the memo is recorded, and the mediator is notified if the applicant changes it back through the portal ([audit-trail.md](./audit-trail.md)).
- **Follow-up inspections** — not designed yet; they don't change the adoption status.
