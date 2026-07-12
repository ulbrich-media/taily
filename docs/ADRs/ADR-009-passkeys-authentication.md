# ADR-009: Passkeys (WebAuthn) via laravel/passkeys

## Status

Accepted

## Context

ADR-008 introduced Laravel Fortify and deliberately deferred passkeys: Fortify pulls in `laravel/passkeys` as a dependency (`Features::passkeys()`), but wiring it up extends both the login and settings flows with a WebAuthn ceremony layer, so it was tracked as separate follow-up work. This ADR covers that follow-up.

Passkeys (WebAuthn resident credentials) let a user sign in with a device-bound key backed by a biometric or PIN unlock — Face ID, Touch ID, Windows Hello, or a hardware security key — instead of a password. They are phishing-resistant (the credential is bound to the relying party's origin, so it cannot be replayed against a look-alike domain) and, because a resident-key ceremony already combines possession of the device with a user-verification step, they satisfy multi-factor authentication on their own; this is the same treatment GitHub and Google give passkey sign-ins.

`laravel/passkeys` is the official first-party package (maintained by the Laravel team, the one Fortify itself depends on for its own passkey feature) and ships a matching first-party JavaScript client, `@laravel/passkeys`, with React/Vue/Svelte helpers. Both were evaluated against writing a hand-rolled WebAuthn integration (e.g. on top of `web-auth/webauthn-lib` directly) and against third-party alternatives (`Laragear/WebAuthn`); the first-party pair was chosen for the same reasons Fortify itself was chosen over Breeze in ADR-008 — maintained upstream, evolves with Fortify, and needs no hand-written ceremony code (registration options, attestation/assertion validation, and challenge/session bookkeeping are handled entirely by the package).

## Decision

Use `laravel/passkeys` (server) and `@laravel/passkeys` (client) for passkey registration and login.

Integration approach, consistent with ADR-008:

- **Routes stay explicit.** Fortify already calls `LaravelPasskeys::ignoreRoutes()` internally once `Fortify::ignoreRoutes()` is active, so the package never registers its own routes. `routes/internal.php` wires the package's own controllers directly (`PasskeyLoginController`, `PasskeyRegistrationController`) at the same paths the `@laravel/passkeys` client expects by default (`/passkeys/login/options`, `/passkeys/login`, `/user/passkeys/options`, `/user/passkeys`, `/user/passkeys/{passkey}`), under the existing `/internal` prefix.
- **Management is gated like 2FA.** Registering and deleting a passkey sit behind `password.confirm`, matching the package's own `management_middleware` default and the treatment 2FA management already gets in `routes/internal.php`.
- **Login does not additionally require 2FA.** A resident-key WebAuthn assertion already proves possession (the device) and knowledge/inherence (its PIN or biometric unlock), so passkey logins authenticate on their own rather than routing through the 2FA challenge that password logins fall back to.
- **The relying party is the frontend's origin, not the API's.** Fortify's own service provider seeds `passkeys.relying_party_id` and `passkeys.allowed_origins` from `app.url` (the API), but the WebAuthn ceremony runs in the browser at the SPA's origin. `Taily\Providers\FortifyServiceProvider` overrides both from `taily.frontend_url` and the existing CORS allow-list (`config/cors.php`) so every origin the SPA is legitimately served from can complete a ceremony.
- **The `passkeys` table gets a hand-written migration**, not the package's published one, so `user_id` uses `foreignUuid` like every other user-referencing table in this schema (the package's own migration uses `foreignIdFor`, which resolves to the same UUID column, but a hand-written migration keeps this schema's single-file-per-change convention).
- **`User` implements `Laravel\Fortify\Contracts\PasskeyUser`** via `Laravel\Fortify\PasskeyAuthenticatable` (Fortify's thin wrapper around the package's own contract/trait), matching how Fortify's own documentation pairs the two packages.
- **Listing is Taily's own endpoint.** The package ships registration (`options`/`store`/`destroy`) and login (`options`/`store`) endpoints but no way to list a user's passkeys for a settings UI, so `PasskeyController::index` (Taily's own, following the same pattern as `ApiTokenController`) fills that gap.
- **The frontend uses `@laravel/passkeys` for the WebAuthn ceremony itself** (`navigator.credentials` calls are fiddly to get right by hand), configured with `credentials: 'include'` and absolute API URLs since the SPA and API are typically different origins. The login page also enables the client's passkey-autofill (conditional UI) support, so a saved passkey can surface directly from the email field's browser-native autocomplete dropdown — the same default UX GitHub, Google, and other passkey-first applications ship.

## Consequences

### Positive

- Passkey support arrives almost entirely from upstream code: ceremony validation, challenge/session handling, and the browser-side WebAuthn calls are all maintained by the Laravel team rather than hand-written here.
- The default configuration is already security-conscious: resident keys are required (so login needs no separate username step), user verification is required (so a stolen device alone cannot authenticate), and attestation is not checked (the recommended posture for passkeys, since attestation mainly matters for enterprise device-inventory use cases Taily does not have).
- Deleting a passkey and registering a new one are both gated behind a fresh password confirmation, so a hijacked or unattended session cannot silently add a persistent credential or remove the account's existing ones.

### Negative

- A second runtime dependency pair (PHP package plus its transitive `web-auth/webauthn-lib`, and the npm package) that must be kept compatible with framework and Fortify upgrades.
- The relying party ID is derived from `taily.frontend_url`; deployments that change the SPA's origin without updating that config would silently break passkey ceremonies (existing passkeys would stop validating) rather than fail loudly at boot.

## Alternatives Considered

- **Hand-rolled WebAuthn on `web-auth/webauthn-lib` directly**: rejected for the same reason ADR-008 rejected hand-writing 2FA — this is substantial security-sensitive code (attestation/assertion validation, challenge storage, credential exclusion) that the first-party package already provides and maintains.
- **`Laragear/WebAuthn`**: a well-regarded third-party alternative, but not what Fortify itself pulls in, and Taily's Fortify integration already assumes and configures for `laravel/passkeys` (Fortify's `configurePasskeys()` seeds `passkeys.*` config unconditionally).
- **Not using `@laravel/passkeys` on the frontend and calling `@simplewebauthn/browser` directly**: possible, since that is the package's only real dependency, but it would mean re-implementing the options/submit request flow, CSRF header handling, and typed error mapping that `@laravel/passkeys` already provides — and forgoing its React hook (`usePasskeyVerify`) that drives passkey autofill for free.
