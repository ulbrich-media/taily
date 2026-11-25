# Adding a new dependency for agent-implemented work

Agents never run `composer require` or `npm install <pkg>` themselves. No human is present mid-run to
grant the consent `AGENTS.md`'s Restrictions section requires, so the agent stops and reports what it
needs instead. Installing the dependency yourself, deliberately, on a branch is the consent — no
separate approval comment needed.

To clear the block, get the dependency merged into `development`, then re-run the agent task so it
starts from a `development` that includes the package.

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
3. **Re-run the agent task** on the original issue. It now starts from `development` with the
   dependency included.

## Why agents don't do this themselves

`composer require`/`npm install` need real package-resolution network access and write a lockfile as a
side effect that isn't reviewable the way a code diff is — bypassing that review is exactly what
`AGENTS.md`'s consent requirement exists to prevent. Keeping it a small, separate, human-authored PR
also means it merges (and can be reverted) independently of the feature work that depends on it.
