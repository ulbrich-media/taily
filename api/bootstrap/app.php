<?php

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull;
use Laravel\Sanctum\Http\Middleware\CheckAbilities;
use Laravel\Sanctum\Http\Middleware\CheckForAnyAbility;
use Taily\Http\Middleware\SetReferrerPolicyHeader;

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
        // inspect/*/submit and contracts/*/submit used to be exempted here too,
        // but the public signing/inspection pages do have a session (via
        // EnsureFrontendRequestsAreStateful on the GET show routes), so a
        // forged cross-site submission without the CSRF cookie would
        // otherwise attribute someone else's IP/user-agent to a signature or
        // verdict in the audit trail. invitations/*/accept has no prior GET
        // on the same session to anchor a token to, so it stays exempted.
        $middleware->validateCsrfTokens(except: [
            'internal/invitations/*/accept',
        ]);
        $middleware->remove([
            ConvertEmptyStringsToNull::class,
        ]);
        $middleware->api(append: [
            SetReferrerPolicyHeader::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create()
    ->useAppPath(dirname(__DIR__).'/src');
