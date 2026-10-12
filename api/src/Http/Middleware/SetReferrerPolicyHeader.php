<?php

namespace Taily\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * No page in this app loads third-party resources today, but without this
 * header a stray <img>/<script> tag one PR away would leak a signing or
 * pre-inspection token to a third party via its Referer request.
 */
class SetReferrerPolicyHeader
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        return $response;
    }
}
