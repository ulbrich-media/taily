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

];
