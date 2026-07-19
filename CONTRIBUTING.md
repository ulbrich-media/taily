# Contributing to Taily

> [!NOTE]
> Taily is currently in open development — the process is defined and enforced, but external contributions are not yet being accepted. If you'd like to contribute, please reach out first to coordinate. After the v1 production release this will become a fully open project.

## Commit Message Convention

All pull request titles must follow the [Conventional Commits](https://www.conventionalcommits.org) specification. Because PRs are squash-merged into `development`, the PR title becomes the commit message that lands in the branch. This is enforced automatically by a CI check on every PR.

### Format

```
<type>[optional scope]: <description>
```

### Types

| Type       | When to use                                              | Semver impact |
|------------|----------------------------------------------------------|---------------|
| `feat`     | A new feature visible to operators or end users          | minor         |
| `fix`      | A bug fix                                                | patch         |
| `perf`     | A performance improvement                                | patch         |
| `refactor` | Code restructuring with no behaviour change              | none          |
| `chore`    | Tooling, dependencies, CI, repo maintenance              | none          |
| `docs`     | Documentation only                                       | none          |
| `style`    | Formatting, whitespace (no logic change)                 | none          |
| `test`     | Adding or updating tests                                 | none          |
| `ci`       | Changes to CI/CD configuration                           | none          |
| `build`    | Changes to the build system                              | none          |

### Breaking Changes

Append `!` after the type, or add a `BREAKING CHANGE:` footer in the PR description body:

```
feat!: remove legacy XML import endpoint
```

~~Breaking changes trigger a major version bump at the next release.~~  
Breaking changes normally trigger a major version bump. During the beta phase (`v0.x`) they are configured to bump the minor version instead, to avoid a premature v1 release. This will change when v1 is intentionally cut.

### Examples

```
feat: add batch animal import via CSV upload
fix: correct pagination offset on search results page
fix(api): return 422 instead of 500 on invalid media type
chore: upgrade Laravel to 12.x
refactor: extract AnimalRepository from controller
```

### Scopes

Scopes are optional. Use them when the change is clearly contained to a subsystem:

- `api` — backend only
- `frontend` — React SPA only
- `db` — migrations or schema
- `auth` — authentication / authorisation

## Branching

- All work targets `development`. Open a PR against `development`.
- `main` is managed exclusively by CI. Do not push to it directly.
- For hotfixes against a released version, see the [Hotfix Process](docs/release-architecture.md#hotfix-process) in the release architecture docs.

## Using Claude on Issues

Maintainers and collaborators can ask Claude to draft or refine an implementation plan directly on a GitHub issue, instead of writing one by hand.

- Comment `@claude refine` — at the very start of the comment — on an open issue (not a PR) to trigger it. The rest of that same comment can contain your actual feedback, e.g. `@claude refine — also require re-verification when the email changes`.
- **First run**: Claude writes an initial functional + technical plan as a single tracked comment on the issue.
- **Every following `@claude refine`**: Claude rewrites that same comment, incorporating everything commented on the issue since the last update as feedback — including whatever you wrote in the same message that triggered this run.
- Only comments from users with write access to the repo (`OWNER`/`MEMBER`/`COLLABORATOR`) can trigger it.

See [docs/ai-github-automation.md](docs/ai-github-automation.md) for how this works under the hood, how it's protected, and what's planned next.
