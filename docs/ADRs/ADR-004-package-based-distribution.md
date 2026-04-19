# ADR-003: Package-Based Distribution Architecture

## Status

Accepted

## Context

Taily needs to be installable on shared hosting environments (Apache/nginx) as well as via Docker. The primary concern is a safe and simple update mechanism: on update, application code must be replaceable without any risk of touching user-uploaded files, instance configuration, or local customizations.

A tarball-based distribution approach was considered but rejected because it mixes application code and instance data in the same directory tree. Any update script must explicitly exclude user files, which is error-prone and places the burden of correctness on the operator.

Composer's `create-project` and `update` commands were evaluated. The key insight is that `composer update` only ever writes to the `vendor/` directory. If the entire application core lives inside `vendor/`, the separation between application code and instance data becomes structural rather than conventional — it is enforced by how Composer works, not by careful scripting.

## Decision

Taily will be restructured into two Composer packages:

- **`ulbrich-media/taily`** — the application core (all controllers, models, routes, migrations, compiled frontend assets). Distributed as a Composer package. This is the same repository as the development monorepo.
- **`ulbrich-media/taily-app`** — a minimal project scaffold used for first-time installation via `composer create-project`. Contains only the Laravel bootstrap layer and user-owned files.

The monorepo uses two long-lived branches with identical directory structure:

- **`development`** — active development branch. PRs are squash-merged here.
- **`main`** — production branch. Every push to `main` triggers CI: the React SPA is built and committed into `api/public/dist/`, `semantic-release` determines the version from Conventional Commits, tags the release, and back-merges `main` into `development`. Packagist is pointed at this branch. Tags are applied here.

A `.gitattributes` file on `main` marks `frontend/` and other dev-only directories as `export-ignore`, so `composer require` downloads only the application core and compiled assets — not the frontend source, docs, or tooling.

Laravel's `vendor:publish` mechanism copies the compiled assets from `api/public/dist/` directly into the operator's `public/` root (`public_path()`), so the SPA is served from the domain root (`/`). The web server routes `/api/*` to Laravel's `index.php` and falls back to the SPA's `index.html` for all other paths. This step is automated via `post-update-cmd` in the scaffold's `composer.json`, so operators never need to run it manually.

## Consequences

### Positive

- `composer update ulbrich-media/taily` is the complete update command for shared hosting deployments. No manual file management required.
- User-owned files (`.env`, `storage/`, published config) are structurally outside `vendor/` and cannot be touched by an update.
- The same structural separation also makes tarball updates safe: only `vendor/` needs to be replaced.
- Docker deployments benefit from the same separation: app code is in the image, user data is in volumes.
- No Node.js required on production servers — the React SPA is pre-built by CI.

### Negative

- All PHP namespaces must be renamed from `App\` to `Taily\` (mechanical, but a large changeset).
- Compiled frontend assets are committed into the `main` branch. This is intentional and necessary, but goes against the general convention of not committing build output.
- After each release, `main` is merged back into `development` to keep both branches in sync (VERSION, CHANGELOG, and assets). This is handled automatically by CI.
- Initial setup complexity is higher than a simple git-based deployment.

## Alternatives Considered

**Tarball distribution without package restructuring:** Rejected because updates require explicit exclusion of user files, which is fragile and places correctness burden on the operator.

**Git-based deployment (`git pull` on the server):** Clean for developers but not suitable for shared hosting operators who should not be exposed to the source repository.

**Docker-only distribution:** Docker was evaluated as the primary target but deprioritized. Shared hosting is the primary deployment target and Docker is not available on most shared hosting environments.

**Separate distribution repository:** A separate `ulbrich-media/taily` repository maintained purely as a CI-managed release artifact was considered. Rejected because the only meaningful benefit — keeping build output out of the source repo — is already achieved by `.gitattributes` export-ignore and the `development`/`main` branch split. A second repository adds cross-repo push credentials, two Packagist webhook registrations, and contributor confusion without a compensating benefit for a project of this size.
