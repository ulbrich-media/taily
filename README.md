# Taily

Animal adoption is a process, not just a moment. Taily keeps your animal welfare organization on top of every step, so you can focus on finding loving homes instead of staying organized.

Self-hosted. Runs on shared hosting. Installs via Composer.

> [!WARNING]
> Taily is in active beta development. The API and data structures will change without notice. Do not use in production.

## Roadmap

**Phase 0 — Foundation** `released`  
Basic setup, user management, and core data management (animals, people).

**Phase 1 — Adoption Process** `in progress`
- Application
- Inspection `in progress`
- Contract
- Transport management

**Phase 2 — Ecosystem** `planned`  
Tasso export, public APIs, and the production v1 release.

**Considering for the future**  
Follow-up inspections · Social media manager · Applicant portal

## Project Structure

```
.
├── api/       # Laravel application with DDEV
├── docs/      # Project documentation
├── frontend/  # React based SPA  
└── README.md  # This file
```

## Technology Stack

- **Backend**: Laravel 12 (PHP 8.3)
- **Frontend**: React with Shadcn/ui components, TanStack Query, TanStack Router, react-hook-form, zod

See [docs/ADRs](docs/ADRs) for architecture decisions.
