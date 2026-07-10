# ADR-008: Laravel Fortify for Authentication

## Status

Accepted

## Context

Authentication was previously implemented with code copied from Laravel Breeze's API stack: a hand-maintained `AuthenticatedSessionController`, `LoginRequest`, and `PasswordController` inside the Taily package. Only login, logout, and password change existed; password reset, two-factor authentication, and other account-security features are on the roadmap and would each have to be hand-written and maintained.

Laravel Breeze was evaluated as an alternative and rejected: it is one-time scaffolding rather than a runtime dependency (no updates flow to the project), it has been superseded by the Laravel 12 starter kits and no longer receives features, it does not include two-factor authentication at all, and its installer targets a standard app skeleton that does not match this repository's package layout (`Taily\` namespace under `api/src/`, routes registered by `TailyServiceProvider`, standalone React SPA).

Laravel Fortify is the headless authentication backend used by the official Laravel starter kits. It is a maintained runtime package, frontend-agnostic (returns JSON for XHR requests), and provides login, logout, password reset, password update, email verification, password confirmation, and TOTP two-factor authentication as individually toggleable features with customization hooks (action classes, response contract bindings, events).

## Decision

Use Laravel Fortify as the authentication layer for the internal API and delete the Breeze-derived code.

Integration approach:

- **Routes stay explicit.** `Fortify::ignoreRoutes()` is called in `Taily\Providers\FortifyServiceProvider`, and only the needed endpoints are registered in `routes/internal.php`, pointing directly at Fortify's controllers. Existing paths (`/internal/login`, `/internal/logout`, `/internal/profile/password`) are unchanged; `/internal/forgot-password` and `/internal/reset-password` are new. This also prevents Fortify from claiming routes in a host application that installs the Taily package.
- **Features are opt-in.** Only `resetPasswords` and `updatePasswords` are enabled. Registration stays disabled — onboarding remains invitation-based. Two-factor authentication will be enabled through the same provider when it is built.
- **Customizations use Fortify's extension points.** `last_login_at` is set by a listener on the framework `Login` event; the password update/reset rules live in `Taily\Actions\Fortify\*` action classes (including the `logoutOtherDevices()` behavior from the old controller); the German success message for password changes comes from a custom `PasswordUpdateResponse` binding.
- **Password reset does not leak account existence.** Custom bindings for Fortify's response contracts answer every reset link request with the same generic message (whether the email matched a user, or the broker throttled a repeat request), and report every failed reset as an invalid token. Neither endpoint can be used to probe which email addresses have an account.
- **Password reset mail is Taily's own.** `User::sendPasswordResetNotification()` sends a German mailable whose link goes through `FrontendUriBuilder` to the SPA callback route (`/callback?action=password_reset&token=…&email=…`), consistent with the invitation mail.
- **Profile endpoints stay hand-written.** Fortify's `updateProfileInformation` feature requires the email address to be part of the update contract; Taily's profile update is deliberately name-only. The 10-line `ProfileController` carries no security logic worth outsourcing.

## Consequences

### Positive

- Password reset arrived essentially for free (broker orchestration, token lifecycle, throttling) and two-factor authentication can later be added on the same foundation instead of being hand-written.
- Security-critical code (login pipeline, rate limiting, token handling) is maintained upstream and updated via `composer update`.
- The Fortify login pipeline reproduces the old Breeze semantics exactly (5 attempts per minute keyed by email+IP, session regeneration, limiter cleared on success), so behavior is preserved rather than re-implemented.
- Less hand-maintained auth code in the repository (`AuthenticatedSessionController`, `LoginRequest`, `PasswordController`, `UpdatePasswordRequest` deleted).

### Negative

- A new runtime dependency that must be kept compatible with framework upgrades.
- Login lockout now answers HTTP 429 (Fortify's `LockoutResponse`) instead of the previous 422; clients must treat both as failed logins.
- Fortify's behavior is configured indirectly (config keys, contract bindings, action classes) rather than being visible in plain controllers, which adds a layer of indirection when debugging.
- Fortify's login route is registered without the `guest` middleware (as before), so the flows Fortify normally guards with redirects are handled by the SPA.

## Alternatives Considered

- **Laravel Breeze**: rejected for the reasons summarized in the context section (scaffolding-only, effectively legacy, no 2FA, skeleton mismatch).
- **Continue hand-writing auth features**: password reset alone is small (framework `Password` broker), but two-factor authentication is substantial security-sensitive code, and each feature would grow the maintenance surface that Fortify provides upstream.
- **Laravel Jetstream**: bundles Fortify with a full UI stack (Livewire/Inertia) that conflicts with the standalone React SPA.
