<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull;
use Laravel\Sanctum\Http\Middleware\CheckAbilities;
use Laravel\Sanctum\Http\Middleware\CheckForAnyAbility;
use Taily\Http\Middleware\AuthenticateSanctumSession;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'ability' => CheckAbilities::class,
            'abilities' => CheckForAnyAbility::class,
            // Overrides Laravel's stock 'auth.session' middleware, which is
            // incompatible with Sanctum's stateful SPA guard (see the class docblock).
            'auth.session' => AuthenticateSanctumSession::class,
        ]);
        $middleware->statefulApi();
        $middleware->validateCsrfTokens(except: [
            'internal/invitations/*',
            'internal/inspect/*/submit',
        ]);
        $middleware->remove([
            ConvertEmptyStringsToNull::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create()
    ->useAppPath(dirname(__DIR__).'/src');
