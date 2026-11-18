# ADR-015: Scheduler-driven export to Tiervermittlung.de

## Status

Accepted

## Context

The Operating Organization lists its animals on tiervermittlung.de by hand. The platform offers a push-only Partner-API: the partner sends the complete state of each animal, removes placed animals, and must re-send every listed animal at least every two months. Taily has no queue or worker infrastructure by design ([ADR-012, Constraint 1](ADR-012-contract-generation-and-signing.md#constraint-1-hosting)); the only background mechanism is the scheduler cron entry.

## Decision

- The export runs as scheduled commands: `tiervermittlung:sync` every five minutes, `tiervermittlung:reconcile` daily. Saving an animal never calls the platform.
- Changes are detected by comparing a hash of the payload with the hash stored for the last delivery in `tiervermittlung_listings`, not by model events. Pictures, adoptions and type mappings all feed into the payload or the eligibility rule, so they need no wiring of their own.
- Each run is bounded (pause between requests, request cap) so it stays short on shared hosting; leftovers go out with the next run.
- The animal's id is the platform's `tierId`. Configuration (key, location) lives in env vars; the species mapping lives on the Animal Type.

## Consequences

### Positive

- No new infrastructure; works on the same hosting as the rest of Taily.
- Every change source is covered without listeners, and a failed or skipped run heals itself on the next one.
- The mapper is a pure function of the animal, which keeps it easy to test.

### Negative

- Changes reach the platform with up to five minutes' delay (more if a run hits the request cap).
- Each run builds the payload of every published animal. Fine for the platform's limit of 500 animals per account, but it is work done even when nothing changed.

## Alternatives Considered

- **Calling the API while saving an animal**: adds latency and an external failure mode to every save, and misses changes that don't go through the animal form (pictures, adoptions).
- **Queued jobs per change**: needs a worker, which ADR-012 rules out.
