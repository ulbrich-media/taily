---
name: implement
description: Implement a finalized issue plan and open a PR, or iterate on an existing PR from review/comment feedback. Use when the user runs /implement.
---

Implement code changes and communicate the result **only** through the structured JSON output described in Step 4 — you have no tool access to create PRs, post comments, or write to GitHub in any other way. Deterministic workflow steps outside this skill read your JSON and act on it.

You were handed `IS_PULL_REQUEST` (`true`/`false`) and an issue/PR number in your prompt — that tells you your mode unambiguously, no detection needed beyond that.

## Step 0 — Guard against double-build (build mode only)

If `IS_PULL_REQUEST` is `false`, first check whether a PR already exists for this issue before doing anything else:

`gh api search/issues -f q="repo:{owner}/{repo} is:pr is:open head:claude/implement/issue-{issue_number}-"`

(Note the trailing hyphen — GitHub's `head:` search qualifier does a prefix match, so without it `issue-4` would also match a branch like `issue-42-add-export`.)

If one is found: stop immediately. Output `mode: "blocked"` with a `blocked_reason` explaining a PR already exists and that further work should happen by commenting `@claude implement` **on that PR** (not the issue) — commenting on the issue again would create a second, disconnected branch instead of continuing the existing one.

## Step 1 — Read the spec

**Build mode** (`IS_PULL_REQUEST: false`): find the `<!-- claude-plan -->` marker comment on the issue (`gh api repos/{owner}/{repo}/issues/{issue_number}/comments`, same lookup the `/refine` skill uses). Read its Status line *semantically* — does it say "Ready to implement", not "Currently being refined" — rather than matching the exact rendered text, since formatting may vary slightly between runs.

- No marker comment at all, or Status is not "Ready to implement": stop. Output `mode: "blocked"` with a specific `blocked_reason` (e.g. "no plan comment found — run `@claude refine` first" or "plan is still marked Currently being refined").

**Iterate mode** (`IS_PULL_REQUEST: true`): read the PR's conversation comments (`gh api repos/{owner}/{repo}/issues/{pr_number}/comments`) and inline review feedback (`gh api repos/{owner}/{repo}/pulls/{pr_number}/comments` and `.../pulls/{pr_number}/reviews`) — note each item's `id` and whether it's an inline review comment or a plain conversation/review-body comment, you'll need both later. There's no persistent "since last run" marker on a PR — read all open feedback and cross-reference it against the current diff (`gh pr diff {pr_number}`), only treating what isn't already reflected in the code as new.

**Evaluate every piece of feedback — don't blindly implement it.** You're not a mail merge for review comments. For each distinct point raised, form your own judgment: implement it if it's correct and applicable; decline it, with your reasoning, if it's factually wrong, conflicts with an established pattern or ADR, is out of scope for this PR, or you simply disagree; ask for clarification if you can't tell what's actually being requested. Disagreeing with a clear explanation is exactly as valid an outcome as making the change — silently complying with feedback you think is wrong is worse than pushing back on it. Every item you evaluate becomes one entry in `feedback_responses` (Step 4), whether you agreed with it or not.

## Step 2 — Implement

Read `CONTEXT-MAP.md`, the relevant per-context `CONTEXT.md` (`api/CONTEXT.md` / `frontend/CONTEXT.md`), and any `docs/ADRs/` that touch the area before writing code (per `docs/agents/domain.md`). Use the glossary's exact vocabulary. If what you're doing would contradict an existing ADR, don't silently override it — say so explicitly in `checks_summary` or `pr_body`.

Hard constraints, all from `AGENTS.md` and the repo's own documented conventions:

- Backend code lives under `api/src/` in the `Taily\` namespace, not `App\` (ADR-004).
- The frontend is a React SPA strictly decoupled from Laravel via the JSON API — no Blade, no Inertia (ADR-002).
- UI components are Shadcn, copied into `frontend/src/components/ui/` — extend/reuse what's there rather than installing another component library (ADR-003).
- Follow `docs/coding-patterns/`: `route-hooks-and-components.md`, `decoupled-route-and-page.md`, `frontend-links.md` (`FrontendUriBuilder`, never inline the frontend URL), `tokens.md` (`HasAccessToken` vs. self-contained token model), `empty-strings.md` (non-nullable strings default to `''`, not `null`), `api-type-handling.md` (backend responses always through Resources, never raw models; frontend types live one-file-per-entity in `frontend/src/api/types/*.ts` and mirror the Resource; nullable fields are `Type | null`, never `Type | undefined`), `file-storage.md`, `form-reset-after-submit.md`, `media-urls.md`.
- Any change to `api/routes/api.php`, `api/src/Http/Controllers/Api/`, or `api/src/Http/Resources/Api/` requires a matching hand-edit to `api/public/openapi.yaml` — it is hand-maintained and not auto-generated, and easy to forget.
- **You are not allowed to add or upgrade a package.** No human is available mid-run to grant the consent `AGENTS.md` requires for this. If the work seems to need a new dependency, don't install it — say so in `blocked_reason` (build mode) or `checks_summary` (iterate mode) instead of proceeding.
- Keep solutions simple — avoid over-engineering, and follow existing Laravel/React conventions already present in the surrounding code rather than introducing new patterns.
- UI copy is German; code, identifiers, and comments are English.

## Step 3 — Check-and-fix loop (bounded)

Run, in this order, from the repo root unless noted:

- `api/vendor/bin/pint --test` (backend lint, check-only — matches CI exactly)
- `php api/artisan test` (backend tests)
- `npm run lint` (working directory `frontend`)
- `npm run format` (working directory `frontend`, check mode)
- `npm run test` (working directory `frontend`)
- `npm run build` (working directory `frontend`)

If anything fails, fix it and re-run the full set. **Up to 3 full cycles.** If checks are still failing after the third cycle, stop trying — set `checks_passed: false` and describe exactly what's still failing in `checks_summary`. Do not loop indefinitely, and do not skip producing output because checks aren't green — a draft PR with a clear explanation is the expected outcome in that case, not silence.

## Step 4 — Structured output

End your turn by producing JSON matching the schema you were given, nothing else. Do not post to GitHub, do not write PR or comment text to a file — the workflow's deterministic follow-up steps read this JSON directly:

- `mode`: `"build"`, `"iterate"`, or `"blocked"` (matches what you determined in Step 0/1).
- `checks_passed`: boolean, from Step 3.
- `checks_summary`: what's still failing, if anything. Empty string if everything passed.
- `pr_title` (build mode only): a valid [Conventional Commit](https://www.conventionalcommits.org) type + description (`feat`, `fix`, `perf`, `refactor`, `chore`, `docs`, `style`, `test`, `ci`, `build`) — this becomes the actual squash-merge commit message, and the PR will fail its title-lint check if it doesn't conform.
- `pr_body` (build mode only): what was implemented and why, referencing the issue (`Closes #{issue_number}`) so merging auto-closes it. Fold `checks_summary` into this if checks didn't pass.
- `what_changed` (iterate mode only): a short markdown summary of what you changed overall, posted as a plain PR comment. Also cover any `feedback_responses` entries of `comment_type: "general"` here (see below), since those don't get an individual reply — reference what they were about.
- `feedback_responses` (iterate mode only): one entry per distinct piece of feedback you evaluated in Step 1, whether you agreed with it or not:
  - `comment_id`: the numeric id of the specific inline review comment, when `comment_type` is `"review_comment"` (omit/ignore for `"general"`).
  - `comment_type`: `"review_comment"` for an inline diff comment (GitHub can thread a reply under it), or `"general"` for a conversation-tab comment or a review's overall body text (no threading primitive exists for these — they get folded into `what_changed` instead).
  - `action`: `"implemented"`, `"declined"`, or `"clarification_needed"`.
  - `reasoning`: for `"declined"` or `"clarification_needed"`, this is the whole point — explain why clearly enough that a human can evaluate your judgment. For `"implemented"`, a short confirmation is enough.
- `blocked_reason` (blocked mode only): a clear, specific explanation of why you stopped and what needs to happen next.

## Must not do

- Merge, close, or approve anything.
- Force-push, rebase, or run any raw `git` command — you don't have Bash access to git, and shouldn't need it; the harness handles branch/commit/push.
- Edit anything under `.github/workflows/` or `.claude/`.
- Add, remove, or upgrade a dependency, or otherwise touch a lockfile, without it being something the issue/plan already explicitly asked for.
- Post anything to GitHub directly, by any means — everything goes through the Step 4 JSON.
