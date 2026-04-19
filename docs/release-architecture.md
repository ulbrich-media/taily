# Release Architecture

Taily is distributed as a Composer package. The application core lives inside `vendor/` on the operator's server, which means Composer's own update mechanism enforces the separation between application code and instance data. No update script can accidentally touch user files because they structurally live outside the directory Composer manages.

See [ADR-003](ADRs/ADR-004-package-based-distribution.md) for the reasoning behind this decision.

---

## Repositories

There are two repositories. The monorepo is both the development workspace and the Composer package — no separate distribution repository exists.

| Repository                           | Purpose                                                                                                                  |
|--------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| `ulbrich-media/taily` (this repo)    | Development monorepo and Composer package. Contains `api/` and `frontend/`. The `main` branch is what Packagist serves.  |
| `ulbrich-media/taily-app` (scaffold) | The minimal project skeleton operators use for first-time installation via `composer create-project`. Rarely changes.    |

---

## Branching Strategy

Two long-lived branches exist with identical directory structure:

| Branch        | Purpose                                                                                                     |
|---------------|-------------------------------------------------------------------------------------------------------------|
| `development` | Active development. PRs are squash-merged here.                                                             |
| `main`        | Production. CI builds and commits the SPA here on every push. Packagist points here. Tags are applied here. |

**Rules:**
- All development work and PRs target `development`.
- `main` is only ever written to by CI. No direct pushes.
- Every push to `main` triggers the release pipeline. CI runs, assets are built and committed, and `semantic-release` determines whether a release is warranted based on the commits since the last tag.
- After each release, CI merges `main` back into `development`, bringing `VERSION`, `CHANGELOG.md`, and the committed build assets across. Both branches stay in sync after each release.
- For hotfixes, see the [Hotfix Process](#hotfix-process) below.

A `.gitattributes` file on `main` marks `frontend/`, `docs/`, `.ddev/`, and `.github/` as `export-ignore`. Packagist's dist zip therefore contains only the application core and pre-built assets — not frontend source, documentation, or dev tooling.

---

## Commit Message Convention

All PR titles must follow the [Conventional Commits](https://www.conventionalcommits.org) specification. Because PRs are squash-merged into `development`, the PR title becomes the commit message that lands in the branch.

This convention serves two purposes:
1. It gives `semantic-release` the signal it needs to determine the version bump automatically — no manual version input required.
2. It enables categorized release notes and `CHANGELOG.md` entries (Features, Bug Fixes, etc.) rather than a flat list of commit subjects.

Enforcement: the `amannn/action-semantic-pull-request` GitHub Action runs on every PR and fails if the title does not match the Conventional Commits format. This check runs in `pr.yml`.

Common prefixes and their semver impact as configured:

| Prefix             | Semver impact | Example                                         |
|--------------------|---------------|-------------------------------------------------|
| `feat:`            | minor         | `feat: add batch animal import endpoint`        |
| `fix:`             | patch         | `fix: correct pagination on search results`     |
| `perf:`            | patch         | `perf: cache animal index query`                |
| `refactor:`        | patch         | `refactor: extract AnimalRepository`            |
| `chore:`           | none          | `chore: update GitHub Actions versions`         |
| `docs:`            | none          | `docs: document hotfix process`                 |
| `BREAKING CHANGE:` | minor*        | footer or `feat!:` prefix                       |

---

## How Releases Are Built

Every push to `main` triggers the release pipeline in `.github/workflows/release.yml`. The pipeline runs these jobs in sequence:

1. **CI** — full test suite (lint, unit tests, build check) runs against `main` before any release action is taken. The pipeline stops here if CI fails.

2. **Build assets** — the React SPA is built and the output is compared to what is already committed in `api/public/dist/`. If the assets changed, they are committed to `main` as `chore: build frontend assets`. If unchanged, this step is a no-op.

3. **Release** — `semantic-release` reads the Conventional Commit messages accumulated since the last tag. If there are no releasable commits (`feat`, `fix`, `perf`, `refactor`), no release is created and the pipeline ends here. Otherwise:
   - The next version is determined automatically from the commit types.
   - `CHANGELOG.md` is updated and committed.
   - The `VERSION` file is written and committed.
   - A git tag is pushed.
   - A draft GitHub Release is created. Publishing it is a manual step.

4. **Back-merge** — only runs when step 3 created a release. `main` is merged into `development` via `--no-ff`, bringing the updated `CHANGELOG.md`, `VERSION`, and committed assets across. Both branches are in sync after this step.

Packagist picks up the new tag automatically via webhook.

---

## Hotfix Process

A hotfix is needed when a released version contains a critical defect and `development` has already moved ahead with unrelated changes that must not ship in the patch.

1. **Create a hotfix branch** off the affected release tag:
   ```bash
   git checkout -b hotfix/v1.2.4 v1.2.3
   ```
2. **Apply the fix** — commit directly to the hotfix branch using a conventional commit message (e.g. `fix: correct migration rollback on upgrade`).
3. **Open a PR** from `hotfix/v1.2.4` targeting `main`. CI runs the full test suite.
4. **Merge the PR into `main`** — the push to `main` triggers the release pipeline automatically. `semantic-release` picks up the `fix:` commit and creates a patch release.
5. **Cherry-pick the fix to `development`**:
   ```bash
   git checkout development
   git cherry-pick <fix-commit-sha>
   git push origin development
   ```
6. **Delete the hotfix branch** once the cherry-pick is confirmed merged.

The hotfix branch is intentionally short-lived. Do not accumulate work on it.

---

## Directory Structure After Installation

This is what an operator's installation looks like. The boundary between what Composer owns and what the operator owns is the critical line.

```
my-taily/
│
│   ── Composer-managed (replaced on update) ──────────────────────
├── vendor/
│   └── ulbrich-media/taily/           ← entire application core
│       ├── src/               ← PHP controllers, models, etc.
│       ├── routes/
│       ├── database/migrations/
│       └── public/            ← pre-built React SPA + assets
│
│   ── Published assets (updated by post-update-cmd) ────────────────
├── public/
│   ├── index.php              ← Laravel entry point (scaffold, static)
│   ├── index.html             ← React SPA entry point (published by artisan)
│   └── assets/                ← JS/CSS bundles (published by artisan)
│
│   ── Operator-owned (never touched by Composer) ───────────────────
├── .env                       ← instance configuration
├── storage/
│   ├── app/public/            ← user-uploaded files
│   └── logs/                  ← runtime logs
└── config/
    └── taily.php              ← published config, operator may override
│
│   ── Scaffold (static, changes only on major versions) ─────────────
├── artisan
├── bootstrap/
└── composer.json              ← requires ulbrich-media/taily, defines post-update-cmd
```

The `vendor/` boundary is enforced by Composer. Anything outside it is either scaffold (static boilerplate that almost never changes) or operator-owned (must never be touched by an update).

---

## Delivery Variants

### 1. Composer (Primary Target — Shared Hosting)

**First-time installation:**
```bash
composer create-project ulbrich-media/taily-app my-taily
cd my-taily
cp .env.example .env
php artisan key:generate
php artisan migrate
```

**Update:**
```bash
composer update ulbrich-media/taily
```

That is the complete update command. The scaffold's `composer.json` defines `post-update-cmd` hooks that automatically run:
- `php artisan vendor:publish --tag=taily-assets --force` — copies updated frontend assets to `public/vendor/taily/`
- `php artisan migrate --force` — runs any new database migrations

`.env`, `storage/`, and any published config overrides are untouched.

---

### 2. Tarball *(planned)*

Each GitHub Release will include a pre-packaged tarball containing the full `vendor/` directory, so operators without shell Composer access can update without any build tooling on the server. Not yet implemented.

---

### 3. Docker *(planned)*

A Docker image built from the same distribution package, with instance data in named volumes. Not yet implemented.

---

## What Must Never Be in the Distribution Package

- `.env` or any file containing secrets
- `storage/app/` contents
- Any file the operator is expected to customize after installation

These are enforced via `.gitignore` in the distribution package and `.dockerignore` in the Docker build context.
