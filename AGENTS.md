# Agents Guide

Quick reference for AI agents working on this project.

## Project Overview

Taily system built with Laravel. Supports the adoption process from applicant assessment through legal contracts and handover.

## Repository Structure

```
.
├── api/        # Laravel app - all DDEV commands run here
├── docs/       # Project documentation 
├── docs/ADRs/  # Architecture decisions
├── frontend/   # React based SPA
└── agents.md   # This file
```

## Key Technical Decisions

1. **Laravel 12** with Blade templates (ADR-001, ADR-002)
2. **TailwindCSS + Shadcn/ui** for styling
3. **Laravel Breeze** for authentication
4. **DDEV** runs in `api/` folder only

## Development Workflow

- All Laravel code lives in `api/`
- Run `cd api` before any `ddev` commands
- Always use `ddev` commands:
  - `ddev artisan` instead of `php artisan`
  - `ddev composer` instead of `composer`
  - `ddev php` instead of `php`
- Database: MySQL 8.4
- PHP: 8.3

## Important Notes

- Keep solutions simple - avoid over-engineering
- Follow existing Laravel conventions
- ADRs document architectural decisions - reference them for context
- docs folder contains Markdown files about knowledge and defined features
- UI language is hardcoded German for now; code based language is always English 

## Testing Requirements

Follow the patterns described in `development-process.md` for all testing work.

### Backend

- PHPUnit tests live in `api/tests/Unit/` (pure business logic, no framework dependencies) or `api/tests/Feature/` (HTTP-level integration tests).
- Run the backend test suite before completing any backend work:
  ```bash
  composer test
  ```

### Frontend

- Vitest + React Testing Library tests live alongside the source files as `*.test.ts` / `*.test.tsx`, or in `frontend/src/test/`.
- Write Vitest + RTL tests for critical frontend interactions (form behaviour, data transformations, key UI flows).
- Run the frontend test suite before completing any frontend work:
  ```bash
  npm run test
  ```

### Linting & formatting

Run all quality checks before finishing:
```bash
# Backend
./vendor/bin/pint

# Frontend
npm run lint
npm run format
```

## Coding Patterns

- **Route-specific hooks and links** — Use `Route.useParams()`, `Route.Link`, and imported `Route.useNavigate()` instead of generic router hooks. → [route-hooks-and-components](docs/coding-patterns/route-hooks-and-components.md)
- **Decoupled routes and page components** — Route files own data fetching and navigation; page components own UI and mutations, communicating via callback props. → [decoupled-route-and-page](docs/coding-patterns/decoupled-route-and-page.md)
- **Frontend links via callback** — All backend-generated frontend URLs must go through `FrontendUriBuilder`; never build callback URLs inline. → [frontend-links](docs/coding-patterns/frontend-links.md)
- **Token patterns** — Use the `HasAccessToken` trait to gate access to an existing record; use a self-contained token model when the token record is the business object. → [tokens](docs/coding-patterns/tokens.md)
- **Empty strings** — String fields default to `''` (set via `$attributes` in the model), never `null`, unless `null` carries distinct semantic meaning. → [empty-strings](docs/coding-patterns/empty-strings.md)

## Public API

The public API is documented via a static OpenAPI spec at `api/public/openapi.yaml`, served at `{baseUrl}/openapi.yaml`.

**When changing any public API endpoint** (routes in `api/routes/api.php`, controllers in `api/src/Http/Controllers/Api/`, or resources in `api/src/Http/Resources/Api/`), update `api/public/openapi.yaml` to reflect the change. There is no auto-generation — the file is the source of truth for external consumers.

## Restrictions

- You are not allowed to add packages on your own. You can consider them but have to ask for consent before installation.
