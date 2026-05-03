<?php

namespace Taily\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PublicApiCors
{
    private const HEADERS = [
        'Access-Control-Allow-Origin'  => '*',
        'Access-Control-Allow-Methods' => 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers' => 'Authorization, Content-Type, Accept',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethod('OPTIONS')) {
            return response()->noContent()->withHeaders(self::HEADERS);
        }

        $response = $next($request);
        $response->headers->add(self::HEADERS);

        return $response;
    }
}
