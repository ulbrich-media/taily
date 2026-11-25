<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;

return Application::configure(basePath: dirname(__DIR__))
    // Listeners are always wired explicitly via Event::listen() in the
    // relevant service provider (see FortifyServiceProvider::boot()).
    // Laravel's automatic event discovery scans src/Listeners for handle()
    // methods and would register those same listeners a second time,
    // silently double-firing every one of them (e.g. sending each security
    // notification email twice).
    ->withEvents(discover: false)
    ->withRouting(
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    // Middleware, CSRF exceptions and scheduled tasks are registered by
    // TailyServiceProvider, so installs get them through `composer update`.
    // withMiddleware() itself must stay: it defines Laravel's default
    // global middleware and the `web` / `api` groups.
    ->withMiddleware()
    // Sentry exception reporting is registered by TailyServiceProvider, so
    // installs get it without changing their own bootstrap/app.php.
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create()
    ->useAppPath(dirname(__DIR__).'/src');
