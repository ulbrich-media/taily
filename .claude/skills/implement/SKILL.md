---
name: implement
description: Implement a finalized issue plan and open a PR, or iterate on an existing PR from review/comment feedback. Use when the user runs /implement.
---

Implement code changes and communicate the result through the structured JSON output described in Step 4 — you have no tool access to post comments or otherwise write to GitHub, with exactly two exceptions, both for the same reason: in build mode you create the PR yourself (Step 3.5), and in iterate mode you post your review replies and summary comment yourself (Step 3.6), because each must be authored by you while your own credentials are still live — a deterministic step running after your turn ends only has a dead token or the generic Actions identity to work with. Ready-toggling is the one thing still left to a deterministic workflow step outside this skill, since it's a state change rather than something that needs your authorship attached.

You were handed `IS_PULL_REQUEST` (`true`/`false`) and an issue/PR number in your prompt — that tells you your mode unambiguously, no detection needed beyond that.

## Step 0 — Guard against double-build (build mode only)

If `IS_PULL_REQUEST` is `false`, first check whether a PR already exists for this issue before doing anything else:

`gh api search/issues -X GET -f q="repo:{owner}/{repo} is:pr is:open head:claude/implement/issue-{issue_number}-"`

(The trailing hyphen closes a prefix-match ambiguity — GitHub's `head:` qualifier does a prefix match, so without it `issue-4` would also match a branch like `issue-42-add-export`. The explicit `-X GET` matters too: `gh api` silently defaults to POST once any `-f`/`-F` param is given, and `search/issues` only accepts GET.)

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

**Commit your work as you go, using the `commit_files` tool** (and `delete_files` for removals) — this is your only mechanism for actually persisting anything to GitHub. Editing files with `Edit`/`Write` only changes the local sandbox; nothing reaches GitHub until you call `commit_files` on it, and a run that doesn't finish normally loses whatever was never committed this way. Commit after each logical unit of work rather than saving it all for one commit at the end, and always call `commit_files` one last time immediately before Step 4's output, even if you already committed everything you think you changed — that guarantees nothing from your final edits is left stranded.

## Step 3 — Check-and-fix loop (bounded)

Run, in this order, from the repo root unless noted:

- `api/vendor/bin/pint --test` (backend lint, check-only — matches CI exactly)
- `php api/artisan test` (backend tests)
- `npm run lint` (working directory `frontend`)
- `npm run format` (working directory `frontend`, check mode)
- `npm run test` (working directory `frontend`)
- `npm run build` (working directory `frontend`)

If anything fails, fix it and re-run the full set. **Up to 3 full cycles.** If checks are still failing after the third cycle, stop trying — set `checks_passed: false` and describe exactly what's still failing in `checks_summary`. Do not loop indefinitely, and do not skip producing output because checks aren't green — a draft PR with a clear explanation is the expected outcome in that case, not silence.

## Step 3.5 — Create the PR yourself (build mode only)

This is the one exception to "everything goes through Step 4's JSON," and it exists for a specific reason: the credentials you're running with right now are revoked the moment your turn ends, so a PR created by *you* is the only way it ends up authored by `claude[bot]` (matching your commits) instead of a generic Actions identity — which matters, because PRs opened by the default Actions identity don't auto-trigger `ci.yml` or the title-lint check the way one authored by an App identity does.

Do this immediately after Step 3, before producing the Step 4 JSON:

1. Decide the flag: `--draft` if `checks_passed` is `false`.
2. Check for dependency changes yourself: `gh api repos/{owner}/{repo}/compare/development...$CLAUDE_BRANCH --jq '.files[].filename'` (your working branch name is in the `$CLAUDE_BRANCH` environment variable — use it, don't guess or reconstruct it). If the result includes `composer.json`, `composer.lock`, `frontend/package.json`, or `frontend/package-lock.json`, force `--draft` regardless of `checks_passed`, and prepend this to your `pr_body` before creating the PR:
   ```
   > [!WARNING]
   > Dependency files changed on this branch (composer.json/lock or package.json/lock). New packages require human consent per AGENTS.md — review before merging.
   ```
3. Create it: `gh pr create --repo {owner}/{repo} --base development --head "$CLAUDE_BRANCH" --title "<pr_title>" --body "<pr_body>" [--draft]` — using the exact `pr_title`/`pr_body` you're about to report in Step 4 (with the warning prepended per above, if applicable).

Then continue to Step 4 as normal — still produce the full JSON (including `pr_title`/`pr_body` reflecting what you actually used) even though the workflow no longer creates the PR itself; it uses your JSON to verify the PR exists and as a fallback if this step failed for some reason.

## Step 3.6 — Post your replies and summary yourself (iterate mode only)

Same reasoning as Step 3.5, applied to comments instead of the PR itself: a reply or comment posted by *you* is attributed to `claude[bot]`, matching your commits, instead of the generic Actions identity — and by the time any later workflow step could post on your behalf, your credentials are already dead.

Do this immediately after Step 3, before producing the Step 4 JSON:

1. Post the overall summary: `gh pr comment {pr_number} --repo {owner}/{repo} --body "<what_changed>"` — use the exact `what_changed` text you're about to report in Step 4.
2. Reply individually to each inline review comment you evaluated in Step 1 — every `feedback_responses` entry with `comment_type: "review_comment"`: `gh api repos/{owner}/{repo}/pulls/{pr_number}/comments/{comment_id}/replies -f body="<label> — <reasoning>"`, where `<label>` is `✅ Implemented`, `❌ Declined`, or `❓ Needs clarification` matching that entry's `action`. If a reply call fails, don't let the verdict silently disappear — fold that item into your summary comment (or post a short follow-up `gh pr comment`) so it's visible somewhere.

Then continue to Step 4 as normal — still produce the full JSON (including `what_changed`/`feedback_responses` reflecting what you actually posted); the workflow uses it to verify your comments actually landed and as a fallback if this step failed for some reason.

## Step 4 — Structured output

End your turn by producing JSON matching the schema you were given, nothing else. Aside from Step 3.5's PR creation and Step 3.6's replies/summary comment, do not post to GitHub, and do not write PR or comment text to a file — the workflow's deterministic follow-up steps read this JSON directly:

- `mode`: `"build"`, `"iterate"`, or `"blocked"` (matches what you determined in Step 0/1).
- `checks_passed`: boolean, from Step 3.
- `checks_summary`: what's still failing, if anything. Empty string if everything passed.
- `pr_title` (build mode only): a valid [Conventional Commit](https://www.conventionalcommits.org) type + description (`feat`, `fix`, `perf`, `refactor`, `chore`, `docs`, `style`, `test`, `ci`, `build`) — this becomes the actual squash-merge commit message, and the PR will fail its title-lint check if it doesn't conform.
- `pr_body` (build mode only): what was implemented and why, referencing the issue (`Closes #{issue_number}`) so merging auto-closes it. Fold `checks_summary` into this if checks didn't pass.
- `what_changed` (iterate mode only): a short markdown summary of what you changed overall — the exact text you posted as a plain PR comment in Step 3.6. Also cover any `feedback_responses` entries of `comment_type: "general"` here (see below), since those don't get an individual reply — reference what they were about.
- `feedback_responses` (iterate mode only): one entry per distinct piece of feedback you evaluated in Step 1, whether you agreed with it or not:
  - `comment_id`: the numeric id of the specific inline review comment, when `comment_type` is `"review_comment"` (omit/ignore for `"general"`).
  - `comment_type`: `"review_comment"` for an inline diff comment (GitHub can thread a reply under it), or `"general"` for a conversation-tab comment or a review's overall body text (no threading primitive exists for these — they get folded into `what_changed` instead).
  - `action`: `"implemented"`, `"declined"`, or `"clarification_needed"`.
  - `reasoning`: for `"declined"` or `"clarification_needed"`, this is the whole point — explain why clearly enough that a human can evaluate your judgment. For `"implemented"`, a short confirmation is enough.
- `blocked_reason` (blocked mode only): a clear, specific explanation of why you stopped and what needs to happen next.

## Must not do

- Merge, close, or approve anything.
- Force-push, rebase, or run any raw `git` command — you don't have Bash access to git; use `commit_files`/`delete_files` for every commit instead.
- Edit anything under `.github/workflows/` or `.claude/`.
- Add, remove, or upgrade a dependency, or otherwise touch a lockfile, without it being something the issue/plan already explicitly asked for.
- Call `gh pr ready`, `gh pr merge`, `gh issue comment`, or any other GitHub write beyond: the `gh pr create` call in Step 3.5 (build mode), and the `gh pr comment` / `gh api .../replies` calls in Step 3.6 (iterate mode) — those are the entire exception; everything else still goes through the Step 4 JSON.
