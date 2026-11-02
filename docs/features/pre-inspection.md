# Pre-Inspection

> **Status: planned, not implemented.** Replaces the previous design (attached to Person + Animal Type, using a form template). See [ADR-015](../ADRs/ADR-015-adoption-case-file.md#6-pre-inspections-move-to-the-adoption-and-no-longer-use-a-form-template).

A pre-inspection (German UI: *Vorkontrolle*) is a visit or video call in which an inspector checks whether the applicant's home and living conditions are suitable for **the animal of this adoption**. At the end, the inspector gives a verdict for or against the adoption; the mediator decides whether to proceed.

## Why it belongs to the adoption

Previously, pre-inspections were attached to a Person and an Animal Type and reused across adoptions. But a pre-inspection is strongly tied to the specific animal: a Chihuahua has different requirements than a Husky, even though both are dogs. Attached to the adoption, the pre-inspection knows the animal, and the inspector sees exactly what the applicant sent in for it.

Earlier pre-inspections of the same person are still visible as a cross-reference on the adoption page (see [case-file.md](./case-file.md#second-adoption-by-the-same-person)).

## Why pre-inspections have no form anymore

The inspector's job is to check what the applicant sent in, not to collect a second data set. So the pre-inspection has:

- **Verdict** — approved / rejected (*geeignet* / *nicht geeignet*)
- **Memo** — free text for everything else, including mismatches

> **Example.** The applicant said 200 m². The inspector writes in the memo: *"Die 200 m² enthalten den Dachboden, der nicht bewohnbar ist. Tatsächlich ca. 120 m²."* The mediator reads the memo and corrects the field value. The [audit trail](./audit-trail.md) records the correction. If the applicant changes it back through the portal, the mediator is notified.

Organizations whose inspectors gather information themselves can configure Case File fields hidden from the applicant, which the mediator fills from the memo.

## Data

```
pre_inspections
  id
  adoption_id      the adoption (and so the animal) it is about
  inspector_id     person, nullable
  verdict          null | approved | rejected
  memo             text, default ''
  submitted_at     nullable
  (+ access token via HasAccessToken)
```

An adoption can have several pre-inspections (e.g. a second visit). The mediator's own decision on the step stays on the adoption (see [adoption.md](./adoption.md#pre-inspection)).

## Process

1. The mediator creates a pre-inspection from the adoption, optionally assigning an inspector.
2. A pre-inspection-specific link becomes available, to copy or send to the inspector.
3. The link opens a public page showing the animal and the applicant's Case File — **only fields with `visible_to_inspector`**, in the catalogue's groups, read-only. Contract data like the Ausweisnummer stays hidden. Uploaded files (home video, landlord confirmation) are shown if their field is visible to the inspector.
4. The inspector submits verdict and memo. The link becomes invalid.
5. The mediator can edit verdict and memo in the admin at any time, and can delete a pre-inspection.

The memo and verdict are internal: visible to the inspector and the mediator, never to the applicant.

## Video instead of a pre-inspection

When finding an appointment is hard, or something in the application seems off, the mediator can require the **home video** for this adoption (a [Requirement Override](./case-file.md#requirement-overrides)). Based on the video, the mediator can decide the pre-inspection step without any pre-inspection record. Whether a pre-inspection, a video, both or neither is needed is decided case by case.

## Naming: pre-inspection vs. follow-up inspection

The full name *pre-inspection* is deliberate, even though "inspection" is used in conversation. A **follow-up inspection** — e.g. a checkup a year after the adoption — is a planned, separate feature. Keeping the names distinct in code and docs (`PreInspection`, `pre_inspections`) avoids ambiguity once both exist. *Inspection* on its own is only the general concept of a visit or check.

How follow-up inspections are modeled is not designed yet. It does not change the adoption status.
