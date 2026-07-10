<?php

namespace Taily\Http\Middleware;

use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthenticateSanctumSession
{
    /**
     * Laravel's stock 'auth.session' middleware resolves its guard via Auth::guard()
     * (no argument). After auth:sanctum authenticates a request, Auth::shouldUse()
     * switches that default to the 'sanctum' guard, which is a generic RequestGuard
     * wrapper that doesn't implement StatefulGuard methods like viaRemember() or
     * logoutCurrentDevice() — calling the stock middleware under auth:sanctum throws
     * a BadMethodCallException. This re-implements the same password-hash-in-session
     * invalidation check against the 'web' guard explicitly instead, so
     * Auth::logoutOtherDevices() (which relies on this middleware) actually works.
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (! $request->hasSession() || ! $user || ! $user->getAuthPassword()) {
            return $next($request);
        }

        $sessionKey = 'password_hash_web';

        if ($request->session()->has($sessionKey)
            && ! hash_equals((string) $request->session()->get($sessionKey), (string) $user->getAuthPassword())) {
            Auth::guard('web')->logoutCurrentDevice();
            $request->session()->flush();

            throw new AuthenticationException('Unauthenticated.', ['web']);
        }

        return tap($next($request), function () use ($request, $user, $sessionKey) {
            $request->session()->put($sessionKey, $user->getAuthPassword());
        });
    }
}
