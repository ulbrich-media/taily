# ADR-007: Public API Documentation as a Static OpenAPI File

## Status

Accepted

## Context

The public API needs documentation that external consumers — shelter websites, developers, AI agents — can use to understand the available endpoints, request/response shapes, and authentication requirements.

The API surface is intentionally small (3 endpoints) and designed to be stable. A full auto-generated, interactive Swagger UI would be nice to have, but is not a requirement: the primary consumers are tools and agents that can load a raw spec file directly, not humans browsing a documentation portal.

## Decision

Maintain a handwritten OpenAPI 3.0 spec file at `api/public/openapi.yaml`, served as a static file at `{baseUrl}/openapi.yaml`. No UI is included.

Rationale:
- The public API surface is intentionally small and stable (3 endpoints). The cost of keeping a handwritten spec in sync is low.
- A raw spec file is sufficient for the primary consumers: AI agents, Postman, Insomnia, Stoplight Studio, and any other OpenAPI-compatible tool.
- Zero runtime dependencies, zero CDN requests, fully GDPR-clean.
- Placing the file in `public/` means it is served as a static asset with no route registration or server-side processing required.

## Consequences

### Positive

- No external requests from the server or from users' browsers.
- Consumable by any OpenAPI-compatible tool without extra setup.
- The spec serves as authoritative documentation and can be linted or validated in CI.
- Trivial to add a self-hosted UI later (e.g. Redoc as a single bundled JS file) without changing the spec format or location.

### Negative

- The spec must be updated manually when the API changes. There is no auto-generation to catch drift.
- No interactive "try it out" UI out of the box.

## Alternatives Considered

**dedoc/scramble** — Auto-generates from routes and resources, no annotations needed. Rejected because its UI loads assets from `unpkg.com` with no supported configuration to disable this.

**darkaonline/l5-swagger** — Mature, widely used. Rejected because it requires per-route docblock annotations and loads Swagger UI from a CDN.

**Self-hosted Swagger UI or Redoc** — Viable if an interactive UI becomes a requirement. Would involve downloading the dist bundle once and committing it alongside the spec. Not needed yet given the current consumer profile.
