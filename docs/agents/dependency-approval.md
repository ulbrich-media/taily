# Adding a new dependency for agent-implemented work

`/implement` can never run `composer require` or `npm install <pkg>` itself — see
`.claude/skills/implement/SKILL.md`. No human is present mid-run to grant the consent `AGENTS.md`'s
Restrictions section requires, so it stops and reports `blocked_reason` instead. Installing the
dependency yourself, deliberately, on a branch is the consent — no separate approval comment needed.

`/refine` blocks a plan's Status (`🚫 Blocked — new dependency required`) whenever it needs a package
that isn't installed yet. To clear it, get the dependency merged into `development`, then re-run
`/refine` — build mode of `/implement` always checks out `development` HEAD, so anything not merged
there yet is invisible to it regardless of what branch it lives on.

## Procedure

1. **Add it on a small, standalone branch cut from `development`**, from the repo root (the real
   `composer.json`/`composer.lock` live at the repo root — `api/composer.json` is only a PSR-4 shim;
   `.ddev` also lives at the repo root, so run `ddev composer` from there, not from `api/`):
   ```bash
   git checkout development && git pull
   git checkout -b chore/add-<package-name>

   # PHP:
   ddev composer require <vendor>/<package>[:<constraint>]
   git add composer.json composer.lock

   # or JS:
   cd frontend && npm install <package> && cd ..
   git add frontend/package.json frontend/package-lock.json

   git commit -m "chore(deps): add <vendor>/<package> for #<issue-number>"
   git push -u origin chore/add-<package-name>
   gh pr create --base development \
     --title "chore(deps): add <vendor>/<package>" \
     --body "For #<issue-number>. Adds the dependency only — no code changes."
   ```
2. **Merge that PR into `development`** once CI passes. It's dependency-only with no code changes, so
   it's low-risk and safe to merge immediately — don't bundle it with unrelated changes.
3. **Re-run `@claude refine` on the original issue** to clear the block, then `@claude implement`.
   Build mode checks out `development`, which now includes the dependency.

## Why not let `/implement` do this itself

`use_commit_signing`/the file-ops MCP server can create commits, but `composer require`/`npm install`
need real package-resolution network access and write a lockfile as a side effect that isn't reviewable
the way a code diff is — bypassing that review is exactly what `AGENTS.md`'s consent requirement exists
to prevent. Keeping it a small, separate, human-authored PR also means it merges (and can be reverted)
independently of the feature work that depends on it.
