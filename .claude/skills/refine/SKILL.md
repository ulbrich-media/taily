---
name: refine
description: Write or refine the implementation plan for a GitHub issue, keeping it in a single tracked comment. Use when the user runs /refine.
---

Write or update the implementation plan for the current issue, keeping everything in one tracked comment identified by this marker on its own line at the top of the comment body:
<!-- claude-plan -->

## Step 1 — Determine mode

Fetch the issue itself with `gh api repos/{owner}/{repo}/issues/{issue_number}` (do not use `gh issue view` — it isn't in the allowed toolset) and list its comments with `gh api repos/{owner}/{repo}/issues/{issue_number}/comments`. Check whether one of the comments contains the `<!-- claude-plan -->` marker.

- **No marker found → initial mode.** Read the issue title and body, plus any comments already present (treat them as early feedback/context, not just noise). Write a new plan from scratch.
- **Marker found → refinement mode.** Read every comment posted *after* the marked comment — that is the feedback to incorporate. Rewrite the full plan (not a diff) incorporating that feedback.

In both modes, feel free to post an additional (unmarked) comment asking a clarifying question if the issue or feedback is too thin to plan confidently, or if comments contradict each other (the later comment is usually the more relevant one, but say so explicitly if you're resolving a conflict).

## Step 2 — Write the plan

Use exactly this structure. Compose it as a single markdown string in memory — do not write it to a file. The only permitted tools are repo inspection (`Read`/`Glob`/`Grep`, read-only) and `gh api` / `gh issue comment`; there is no `Write` tool available, so the body must be passed inline as a heredoc when you run the `gh` command in Step 3.

### Dependency check (do this before finalizing Status — every refine pass, including the first)

If the technical approach requires a package that isn't already installed — grep the root `composer.json` (`require`/`require-dev`) for a PHP package, or `frontend/package.json` (`dependencies`/`devDependencies`) for a JS package — set `Status: 🚫 Blocked — new dependency required` (overriding whatever Confidence/open-questions would otherwise give) and include the `## ⚠️ Blocking: New Dependency Required` section (template below) right after the metadata line. Only finding the package actually installed during a later `/refine` pass clears this — drop the section and evaluate Status normally once it does.

```
<!-- claude-plan -->
## Summary
<1-3 sentences, high level. What benefit does the user gain from this being implemented — no code, no implementation detail.>

**Status**: ✅ Ready to implement / ⚠️ Currently being refined / 🚫 Blocked — new dependency required

**Confidence:** 🚨 Low / ⚠️ Medium / ✅ High · **Complexity:** ✅ Low / ⚠️ Medium / 🚨 High · **Scope:** `tag`, `tag`

<Only when the dependency check above found something missing, insert this section here — before Functional Plan, not inside a details block:>

## ⚠️ Blocking: New Dependency Required

`<vendor>/<package>` isn't installed yet, and `/implement` can't install it itself. Land it on `development` first (see [docs/agents/dependency-approval.md](docs/agents/dependency-approval.md)), then re-run `@claude refine`.

## Functional Plan
<Concrete description of the problem being solved and the behavior being implemented.>

<details>
<summary>Functional details</summary>

<Extended decisions, edge cases, anything else interesting from a functional perspective.>

</details>

## Technical Plan
<High-level description of the technical approach — e.g. "extend the existing X service" or "add new endpoint + UI component".>

<details>
<summary>Technical details</summary>

<Detailed, code-literal technical plan: file/module paths (inspect the repo to name real paths), key changes, approach, open risks. This is for developers and for the agent that will later implement the issue — be precise.>

</details>

## Resolved Decisions

<details>
<summary>Decisions made during refinement</summary>

<Bullet list of decisions resolved via comment feedback — i.e. answers to questions asked while refining. If none yet, write exactly: "No decisions made yet.">

</details>
```

Formatting rules:
- Use GitHub's native `<details><summary>` syntax for collapsibles, with a blank line after `</summary>` and before `</details>` so the markdown inside renders correctly.
- Prefix the Status line with ✅ (ready), ⚠️ (being refined), or 🚫 (blocked on a missing dependency), placed directly under the Summary and before the Metadata line. Don't use GitHub's `> [!TIP]`/`> [!WARNING]` alert syntax here — including in the blocking section.
- No external images anywhere in the comment (no shields.io badges etc.) — use plain markdown and emoji only, so nothing depends on a third-party image service.

### Status rule (apply literally, don't eyeball it)

Evaluate in this order:

1. Dependency check above found something missing → `Status: 🚫 Blocked — new dependency required`. This takes priority over everything below, regardless of Confidence or how many decisions are resolved.
2. Otherwise, `Status: Ready to implement` **only** if Confidence = High **and** the Resolved Decisions / feedback leaves no open questions.
3. Otherwise (Low or Medium confidence, or any unresolved open question), `Status: Currently being refined`.

### Confidence / Complexity emoji (apply literally, don't eyeball it)

Prefix each with a single colored circle — ✅ = good, ⚠️ = medium, 🚨 = needs attention:
- Confidence: ✅ High, ⚠️ Medium, 🚨 Low
- Complexity (inverted — simple is the good outcome): ✅ Low, ⚠️ Medium, 🚨 High

### Complexity (pick one)

`Low` — small, isolated, low-risk change. `Medium` — touches multiple areas or has some ambiguity. `High` — cross-cutting, risky, or needs careful human review/monitoring during implementation.

### Scope (pick all that apply, comma-separated)

Feature areas, not technical layers — align with the domain vocabulary in [`api/CONTEXT.md`](../../../api/CONTEXT.md) and [`frontend/CONTEXT.md`](../../../frontend/CONTEXT.md):

`people`, `animals`, `adoption`, `inspection`, `contract`, `transport`, `form-builder`, `organizations`, `public-api`, `auth`, `infrastructure`, `docs`

## Step 3 — Post or update the comment

Pass the plan body inline via a quoted heredoc (`<<'PLAN_EOF'`) so shell/markdown special characters aren't interpreted — never write it to disk first.

- **Initial mode:** post a new comment:
  ```
  gh issue comment {issue_number} --body "$(cat <<'PLAN_EOF'
  <plan markdown>
  PLAN_EOF
  )"
  ```
- **Refinement mode:** edit the existing marked comment in place — do not post a new one. Find its id from the comment listing in Step 1, then:
  ```
  gh api repos/{owner}/{repo}/issues/comments/{comment_id} -X PATCH -f body="$(cat <<'PLAN_EOF'
  <plan markdown>
  PLAN_EOF
  )"
  ```

Keep the plan concise — it's for a human to review and an agent to later implement, not the implementation itself.
