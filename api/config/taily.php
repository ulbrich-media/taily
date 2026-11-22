<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Frontend URL
    |--------------------------------------------------------------------------
    |
    | The public URL of the Taily frontend application. This is used to build
    | callback links in outgoing emails (invitation links, inspection links).
    | Set this to the URL your frontend is served from.
    |
    */

    'frontend_url' => env('TAILY_FRONTEND_URL', env('APP_URL', 'http://localhost')),

    /*
    |--------------------------------------------------------------------------
    | CORS Allowed Origins
    |--------------------------------------------------------------------------
    |
    | Origins that are allowed to make cross-origin requests to the internal
    | API. Add your frontend's origin here if it is served from a different
    | host or port than the API.
    |
    */

    'cors_allowed_origins' => array_filter(
        explode(',', env('TAILY_CORS_ALLOWED_ORIGINS', ''))
    ),

    // Contract templates are configured in the admin UI (ADR-017) and stored
    // in `contract_templates`; every template renders through
    // `contracts/configured.blade.php`.

    /*
    |--------------------------------------------------------------------------
    | Tiervermittlung.de Export
    |--------------------------------------------------------------------------
    |
    | Pushes the published animals to tiervermittlung.de via its Partner-API
    | (https://www.tiervermittlung.de/api/). The API key is created in the
    | club's account there under "Persönliche Daten" → "API-Schlüssel
    | verwalten". Runs from the scheduler (`tiervermittlung:sync`), so the
    | scheduler cron entry is required.
    |
    | Each animal is listed in its `current_country`. Contact details on the
    | listing come from the account itself.
    |
    */

    'tiervermittlung' => [
        'enabled' => (bool) env('TAILY_TIERVERMITTLUNG_ENABLED', false),
        'api_key' => env('TAILY_TIERVERMITTLUNG_API_KEY', ''),
        'base_url' => env('TAILY_TIERVERMITTLUNG_BASE_URL', 'https://www.tiervermittlung.de/api/v1'),
        // The platform allows 60 requests per minute and key. A pause between
        // requests and a cap on animals sent or removed per run keep each
        // scheduler run short; whatever is left over goes out with the next
        // run. A rate-limited request is retried once after `Retry-After`.
        'request_interval_ms' => (int) env('TAILY_TIERVERMITTLUNG_REQUEST_INTERVAL_MS', 1100),
        'max_requests_per_run' => (int) env('TAILY_TIERVERMITTLUNG_MAX_REQUESTS_PER_RUN', 50),
    ],

    /*
    |--------------------------------------------------------------------------
    | Sentry (frontend)
    |--------------------------------------------------------------------------
    |
    | Error monitoring for the React frontend, using the operator's own Sentry
    | project. The backend is configured through the sentry/sentry-laravel
    | variables (SENTRY_LARAVEL_DSN, ...). The frontend reads these values at
    | runtime from GET /internal/client-config, so the prebuilt assets work
    | for every installation. Leave the DSN empty to disable it.
    | See docs/features/error-monitoring.md.
    |
    */

    'sentry' => [
        'frontend_dsn' => env('SENTRY_FRONTEND_DSN', ''),
        'frontend_traces_sample_rate' => (float) env('SENTRY_FRONTEND_TRACES_SAMPLE_RATE', 0.0),
        // Session Replay masks all text and media by default.
        'frontend_replays_session_sample_rate' => (float) env('SENTRY_FRONTEND_REPLAYS_SESSION_SAMPLE_RATE', 0.0),
        'frontend_replays_on_error_sample_rate' => (float) env('SENTRY_FRONTEND_REPLAYS_ON_ERROR_SAMPLE_RATE', 0.0),
    ],

];
