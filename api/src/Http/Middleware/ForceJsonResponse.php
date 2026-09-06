<?php

namespace Taily\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * These route groups are JSON-only APIs with no login page to redirect to.
 * Forcing the Accept header here makes Request::expectsJson() always true,
 * so Laravel's default unauthenticated/guest handling always takes its JSON
 * branch instead of building a redirect via route('login'), which doesn't
 * exist in this app and would otherwise throw a RouteNotFoundException.
 */
class ForceJsonResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');

        return $next($request);
    }
}
