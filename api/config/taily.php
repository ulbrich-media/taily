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

    /*
    |--------------------------------------------------------------------------
    | Contract Templates
    |--------------------------------------------------------------------------
    |
    | Templates available for generating a Schutzvertrag PDF for an adoption.
    | Each entry's `view` is resolved as `taily::{$view}`, so overriding a
    | template means publishing the `taily-views` tag and editing the file at
    | the corresponding `resources/views/vendor/taily/...` path. See ADR-013.
    |
    | Every template extends `contracts/layout.blade.php`, which holds the
    | header and footer bands and the shared styling — override that one file
    | to put an installation's own logo and organisation details on all of
    | them at once.
    |
    */

    'contracts' => [
        'default' => [
            'label' => 'Schutzvertrag (Beispielvorlage)',
            'view' => 'contracts.default',
        ],
    ],

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
    | All animals are listed at the location below — usually the Operating
    | Organization's own — since Taily has no structured location per
    | animal. Contact details on the listing come from the account itself.
    |
    */

    'tiervermittlung' => [
        'enabled' => (bool) env('TAILY_TIERVERMITTLUNG_ENABLED', false),
        'api_key' => env('TAILY_TIERVERMITTLUNG_API_KEY', 'abc'),
        'base_url' => env('TAILY_TIERVERMITTLUNG_BASE_URL', 'https://www.tiervermittlung.de/api/v1'),
        'location' => [
            'country' => env('TAILY_TIERVERMITTLUNG_COUNTRY', 'DE'),
            'zip' => env('TAILY_TIERVERMITTLUNG_ZIP', ''),
            'city' => env('TAILY_TIERVERMITTLUNG_CITY', ''),
        ],
        // The platform allows 60 requests per minute and key. A pause between
        // requests and a cap per run keep each scheduler run short; whatever
        // is left over goes out with the next run.
        'request_interval_ms' => (int) env('TAILY_TIERVERMITTLUNG_REQUEST_INTERVAL_MS', 1100),
        'max_requests_per_run' => (int) env('TAILY_TIERVERMITTLUNG_MAX_REQUESTS_PER_RUN', 50),
    ],

];
