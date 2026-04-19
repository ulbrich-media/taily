# ADR-004: Frontend UI Library

## Status

Accepted

## Context

With the decision to build a React SPA (ADR-002), we need a UI component library. The application has many complex views including searchable dropdowns, multi-tab forms, data tables, date pickers, and modal dialogs. We need components that cover this range without requiring significant custom implementation.

## Decision

We use Shadcn UI as the component library.

Shadcn UI is not a traditional dependency — components are copied directly into the repository and owned by the project. This gives access to a large set of high-quality, accessible components (including complex ones like comboboxes, command palettes, and date pickers) built on Radix UI primitives and styled with Tailwind CSS.

The primary drivers were existing team experience with the library and the availability of advanced components that enabled fast prototyping. A searchable dropdown (combobox), for example, would have required significant custom work with DaisyUI.

The code ownership model is a real trade-off that was consciously accepted (see Consequences below). In a later stage of the project, the component set will likely be pruned to only what is actively used and simplified where the full Radix UI generality is not needed.

## Consequences

### Positive

- Large library of accessible, well-designed components covering advanced use cases
- Existing familiarity enabled fast prototyping
- Components are fully customizable since they live in the project
- No version lock-in or upstream breaking changes affecting the running app
- Consistent design system through shared Tailwind tokens

### Negative

- Components are owned by the project — bug fixes and improvements from upstream must be manually applied
- Initial setup copies substantial boilerplate into the codebase
- Component code can be verbose; unused complexity accumulates if not actively pruned

## Alternatives Considered

### DaisyUI

Well-suited for simpler interfaces but lacks advanced interactive components (combobox, command, complex form elements). Would have required significant custom component work for the interaction patterns Taily actually needs. Comes with trade-offs with accessibility that may lead to problems in the future.

### Headless UI / Radix UI directly

Using Radix UI primitives without Shadcn's pre-styled layer. Provides maximum control but requires building and maintaining all visual styling from scratch. The effort is not justified when Shadcn already provides a well-considered starting point on top of the same primitives.
