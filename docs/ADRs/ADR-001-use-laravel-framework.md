# ADR-001: Use Laravel Framework

## Status

Accepted

## Context

Taily requires a robust web framework that can handle user management, API development, email notifications, and file storage. The framework needs to be maintainable, feature-rich, and deployable on standard hosting environments.

## Decision

We will use Laravel as the primary web framework for this project.

## Consequences

### Positive

- Team has existing experience with Laravel, reducing learning curve and development time
- Built-in user authentication and authorization system
- API development with token-based authentication out of the box
- Integrated mail system for sending notifications
- File management and storage system included
- Easy deployment on PHP-based web hostings (shared hosting, VPS, etc.)
- Large ecosystem and community support
- Comprehensive documentation
- Modern PHP practices and tooling (Composer, Artisan CLI)

### Negative

- Laravel's full-stack approach includes features that may not all be needed
- Requires PHP 8.1+ and associated server configuration

## Alternatives Considered

No other frameworks were evaluated for this project. The decision was made based on team familiarity and known feature set that matches project requirements.
