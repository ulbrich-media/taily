# Error Monitoring (Sentry)

Operators can send errors, traces and logs from their installation to **their own** [Sentry](https://sentry.io) organization. It is off by default: nothing is sent anywhere unless a DSN is configured. Taily itself never receives any data.

Backend (Laravel) and frontend (React) report to separate Sentry projects, each with its own DSN. Either one can be enabled on its own.

## Setup

1. In Sentry, create two projects: one with the **Laravel** platform and one with **React** (e.g. `taily-server` and `taily-frontend`).
2. Copy each project's DSN from **Settings → Projects → [project] → Client Keys (DSN)**.
3. Configure the installation:

   ```dotenv
   # Backend
   SENTRY_LARAVEL_DSN=https://…@….ingest.sentry.io/…
   SENTRY_TRACES_SAMPLE_RATE=0.1

   # Frontend
   SENTRY_FRONTEND_DSN=https://…@….ingest.sentry.io/…
   SENTRY_FRONTEND_TRACES_SAMPLE_RATE=0.1
   ```

4. Clear the config cache (`php artisan config:cache`) and check the backend with `php artisan sentry:test`.

## Options

| Variable | Default | Purpose |
| --- | --- | --- |
| `SENTRY_LARAVEL_DSN` | empty | Backend project DSN. Empty disables backend reporting. |
| `SENTRY_TRACES_SAMPLE_RATE` | none | Share of backend requests traced (`0.1` = 10 %). |
| `SENTRY_ENABLE_LOGS` | `false` | Send Laravel logs to Sentry. Also add `sentry_logs` to `LOG_STACK`, e.g. `LOG_STACK=single,sentry_logs`. |
| `SENTRY_ENVIRONMENT` | `APP_ENV` | Environment name shown in Sentry, used for backend and frontend. |
| `SENTRY_RELEASE` | none | Release name, e.g. the Taily version. Used for backend and frontend. |
| `SENTRY_INSTANCE` | empty | Name of this installation, sent as the `instance` tag on backend and frontend events and feedback. See [Several installations in one project](#several-installations-in-one-project). |
| `SENTRY_FRONTEND_DSN` | empty | Frontend project DSN. Empty disables frontend reporting. |
| `SENTRY_FRONTEND_TRACES_SAMPLE_RATE` | `0` | Share of page loads and navigations traced. |
| `SENTRY_FRONTEND_REPLAYS_SESSION_SAMPLE_RATE` | `0` | Share of sessions recorded with Session Replay. |
| `SENTRY_FRONTEND_REPLAYS_ON_ERROR_SAMPLE_RATE` | `0` | Share of sessions with an error recorded with Session Replay. |

All other `SENTRY_*` options of [sentry-laravel](https://docs.sentry.io/platforms/php/guides/laravel/configuration/options/) apply to the backend as usual.

## Several installations in one project

Several Taily installations can report to the same Sentry projects. Give each one its own name:

```dotenv
SENTRY_INSTANCE=verein-a
```

Every event and every piece of feedback then carries an `instance` tag. In Sentry, filter with `instance:verein-a`, or check the tag breakdown on an issue to see which installations are affected.

Keep in mind that everyone with access to the project sees the errors and feedback of all installations, and that they share the project's quota. A separate client key (DSN) per installation lets you rate-limit each one on its own.

## User feedback

With a frontend DSN configured, users can send feedback to the operator's Sentry project. It shows up under **User Feedback** in Sentry, together with the page, browser and release, and the matching Session Replay if one was recorded.

- **"Feedback geben" button:** a floating button in the bottom left corner on every page, including the public pages applicants use. It opens a form with name, e-mail, description and an optional screenshot. Screenshots count against the Sentry attachments quota.
- **"Problem melden" on the error screen:** when the app shows its error screen, users can describe what they were doing. The description is attached to the reported error.

Without a frontend DSN, neither appears.

## Readable stack traces

The frontend ships with public source maps next to its JavaScript files. When an error comes in, Sentry downloads the matching map from the installation and shows the original file, line and code instead of minified code. Nothing needs to be uploaded or configured, as long as:

- the installation is reachable from the internet, so Sentry's servers can fetch the maps, and
- **Enable JavaScript source fetching** is on in the Sentry project's **General Settings** (on by default).

Browsers only load the maps when the developer tools are open, so they don't slow the app down for users. The backend needs no source maps.

## Privacy

Taily stores personal data of applicants and adopters, and error reports can contain parts of it. Enabling Sentry makes Sentry a processor of that data, so the organization needs to cover it in its privacy documentation (and usually a data processing agreement with Sentry). Sentry offers an EU data region.

- Backend: personal data such as IP addresses and user details is not sent by default (`SENTRY_SEND_DEFAULT_PII=false`). Taily also sets sentry-laravel's `data_collection` so no user info, cookies, request bodies, query strings or SQL bindings are collected, and filters access tokens in URL paths (`before_send`, `before_send_transaction`, `before_breadcrumb`, see `Taily\Support\SentryScrubber`). An operator who sets one of these options in their own `config/sentry.php` replaces Taily's value.
- Frontend: the SDK infers no IP address or user details and sends no cookies, request bodies or URL query strings (`dataCollection` in `frontend/src/lib/sentry.ts`). Access tokens in URL paths (invitations, pre-inspections, contracts, applicant confirmation and login) are replaced with `[Filtered]` in events, breadcrumbs, spans and replays.
- Sentry can still derive the IP address from the incoming request. Enable **Prevent Storing of IP Addresses** in the Sentry project settings (Security & Privacy) for both projects.
- Session Replay is off by default. When enabled, it masks all text and blocks all media.
- Feedback is sent deliberately by the user, but its text and screenshots can still show personal data. Screenshots are not masked.

## How it works

The frontend assets are built once per release and shared by all installations, so the frontend DSN cannot be part of the build. On startup the frontend requests `GET /internal/client-config`, which returns the frontend Sentry settings (or `null` when no DSN is set), and only then initialises Sentry. Errors that happen before that request completes are not reported.

A DSN only allows sending events to a project, not reading them, so serving it without authentication is safe. Sentry's per-key rate limits protect against someone abusing it to fill the project's quota.
