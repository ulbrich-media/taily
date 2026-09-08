<?php

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull;
use Laravel\Sanctum\Http\Middleware\CheckAbilities;
use Laravel\Sanctum\Http\Middleware\CheckForAnyAbility;

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
    // Requires an operator-configured cron entry invoking `schedule:run`
    // every minute — see docs/release-architecture.md. Daily is enough
    // slack for the 2-day-out reminder window; no queue worker involved,
    // per ADR-012 Constraint 1 (no background worker infrastructure).
    ->withSchedule(function (Schedule $schedule): void {
        $schedule->command('contracts:process-reminders')->daily();
    })
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'ability' => CheckAbilities::class,
            'abilities' => CheckForAnyAbility::class,
        ]);
        $middleware->statefulApi();
        $middleware->validateCsrfTokens(except: [
            'internal/invitations/*/accept',
            'internal/inspect/*/submit',
            'internal/contracts/*/submit',
        ]);
        $middleware->remove([
            ConvertEmptyStringsToNull::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create()
    ->useAppPath(dirname(__DIR__).'/src');
