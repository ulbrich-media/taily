# ADR-002: UI Architecture Approach

## Status

Accepted

## Context

Taily requires a user interface that supports:
- CRUD management for animals, people, organizations, and adoptions
- Complex forms with many fields across multiple tabs
- List views with filtering and search
- A multistep adoption workflow with status tracking
- A small public-facing section for applicants

We need to decide on a UI architecture that balances development speed, maintainability, and user experience given the breadth and interactivity of the interface.

## Decision

We use a React single-page application (SPA) served as a static build, consuming the Laravel backend as a pure JSON API.

The primary driver was existing team experience with React, which enables fast development. The nature of the application reinforced this: many complex views with rich interactivity — dependent fields, inline state updates, multi-tab forms — are a natural fit for a component-based SPA. The hosting architecture remains simple: the built SPA is committed to the repository and served as static files from the Laravel public directory (see ADR-001 and ADR-003).

## Consequences

### Positive

- Fast, seamless navigation without full page reloads
- Rich interactivity handled naturally by the component model
- Clean separation between API and UI — Laravel stays focused on data
- Existing React experience enabled rapid prototyping
- Component state management simplifies complex form flows

### Negative

- Requires a build step and Node.js toolchain
- Two distinct technology stacks to maintain
- API contract between frontend and backend must be kept in sync
- No server-side rendering; initial load requires JavaScript

## Alternatives Considered

### Blade with Alpine.js

Server-side rendering with Laravel Blade, adding Alpine.js for lightweight interactivity. Sufficient for simple CRUD screens, but building the interactive forms, dropdowns, and multistep workflows the application requires would push significant complexity into Alpine.js and Blade partials — effectively recreating a component model without the ecosystem.

### Inertia.js

A hybrid approach keeping Laravel routing while using React for page components. Offers React interactivity with a single deployment artifact. Rejected because it adds the Inertia layer without meaningful benefit over a pure API split, and the clean API boundary is valuable for potential future integrations.
