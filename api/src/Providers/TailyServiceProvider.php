<?php

namespace Taily\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Contracts\Debug\ExceptionHandler;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Foundation\Exceptions\Handler;
use Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Mail\Markdown;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Http\Middleware\CheckAbilities;
use Laravel\Sanctum\Http\Middleware\CheckForAnyAbility;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use Sentry\Laravel\Integration;
use Taily\Console\Commands\CheckTiervermittlung;
use Taily\Console\Commands\ProcessContractSigningReminders;
use Taily\Console\Commands\ReconcileTiervermittlung;
use Taily\Console\Commands\SeedDatabase;
use Taily\Console\Commands\SmokeTestAuthConfig;
use Taily\Console\Commands\SmokeTestMailViews;
use Taily\Console\Commands\SyncTiervermittlung;
use Taily\Http\Controllers\Dev\ContractPreviewController;
use Taily\Http\Middleware\EnsureUserIsAdmin;
use Taily\Http\Middleware\ForceJsonResponse;
use Taily\Http\Middleware\PublicApiCors;
use Taily\Http\Middleware\SetReferrerPolicyHeader;
use Taily\Models\User;
use Taily\Support\MediaUrlGenerator;
use Taily\Support\SentryScrubber;
use Taily\Support\Tiervermittlung\TiervermittlungClient;
use Taily\Support\UploadLimits;
use Throwable;

class TailyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../../config/taily.php', 'taily');

        // Set as early as possible so anything that reads this config key
        // gets the right value. This alone does NOT fix laravel/fortify's
        // eager passkeys setup — Fortify reads this same key even earlier,
        // from its own register() (package-discovered providers register
        // before bootstrap/providers.php entries like this one ever run) —
        // that specific case is corrected separately, by directly calling
        // Passkeys::useUserModel() in FortifyServiceProvider::boot() (which
        // runs after Fortify's register()+boot() have both completed).
        config(['auth.providers.users.model' => User::class]);

        $this->configureSentryInstanceTag();
        $this->configureSentryPrivacy();
        $this->registerSentryExceptionReporting();

        $this->app->bind(TiervermittlungClient::class, fn () => new TiervermittlungClient(
            config('taily.tiervermittlung.base_url'),
            (string) config('taily.tiervermittlung.api_key'),
            (int) config('taily.tiervermittlung.request_interval_ms'),
        ));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../../database/migrations');
        $this->loadViewsFrom(__DIR__.'/../../resources/views', 'taily');

        $this->registerFilesystemDisks();
        $this->configureMediaLibrary();

        JsonResource::withoutWrapping();

        // Values in mails (an applicant's name) can't become Markdown links.
        Markdown::withSecuredEncoding();

        $this->registerRoutes();
        $this->registerMiddlewareAlias();
        $this->registerMiddleware();
        $this->registerMiddlewarePriority();
        $this->registerSchedule();
        $this->registerRateLimiters();
        $this->registerCommands();

        $this->publishes([
            __DIR__.'/../../public/dist' => public_path(),
        ], 'taily-assets');

        $this->publishes([
            __DIR__.'/../../resources/views/vendor/mail' => resource_path('views/vendor/mail'),
        ], 'taily-assets');

        $this->publishes([
            __DIR__.'/../../resources/views' => resource_path('views/vendor/taily'),
        ], 'taily-views');

        $this->publishes([
            __DIR__.'/../../config/taily.php' => config_path('taily.php'),
        ], 'taily-config');
    }

    /**
     * Reports exceptions to Sentry. sentry-laravel expects this in the app's
     * bootstrap/app.php (`Integration::handles()`), but installs never get
     * that file updated, so Taily registers it itself. A no-op while no DSN
     * is configured.
     */
    protected function registerSentryExceptionReporting(): void
    {
        $this->callAfterResolving(ExceptionHandler::class, function (ExceptionHandler $handler): void {
            if ($handler instanceof Handler) {
                $handler->reportable(static function (Throwable $exception): void {
                    Integration::captureUnhandledException($exception);
                });
            }
        });
    }

    /**
     * Adds the `instance` tag to sentry-laravel's default tags. Runs in
     * register(): the Sentry client is created lazily from config('sentry')
     * on first use, so it already sees the tag.
     */
    protected function configureSentryInstanceTag(): void
    {
        $instance = (string) config('taily.sentry.instance');

        if ($instance === '') {
            return;
        }

        $tags = (array) config('sentry.tags', []);
        $tags['instance'] = $instance;

        config(['sentry.tags' => $tags]);
    }

    /**
     * Limits what sentry-laravel collects, since Taily handles personal data:
     * no user info, cookies, request bodies, query strings or SQL bindings,
     * and access tokens in URL paths are filtered. Runs in register() for the
     * same reason as the instance tag. Options an operator configured
     * explicitly in config/sentry.php are kept.
     */
    protected function configureSentryPrivacy(): void
    {
        $defaults = [
            'data_collection' => [
                'user_info' => false,
                'cookies' => ['mode' => 'off'],
                'http_bodies' => [],
                'url_query_params' => ['mode' => 'off'],
                'database_query_data' => false,
            ],
            // Array callables, so `config:cache` still works.
            'before_send' => [SentryScrubber::class, 'beforeSend'],
            'before_send_transaction' => [SentryScrubber::class, 'beforeSend'],
            'before_breadcrumb' => [SentryScrubber::class, 'beforeBreadcrumb'],
        ];

        foreach ($defaults as $key => $value) {
            if (config("sentry.$key") === null) {
                config(["sentry.$key" => $value]);
            }
        }
    }

    /**
     * Register the package routes with their required prefix and middleware.
     */
    protected function registerRoutes(): void
    {
        Route::prefix('api')
            ->middleware(['api', ForceJsonResponse::class, PublicApiCors::class])
            ->group(__DIR__.'/../../routes/api.php');

        Route::prefix('internal')
            ->middleware(['api', ForceJsonResponse::class, EnsureFrontendRequestsAreStateful::class])
            ->group(__DIR__.'/../../routes/internal.php');

        // Development tooling, never registered in a served environment.
        // ContractPreviewController repeats this check at request time, and
        // requires a logged-in user on top of it — see the class docblock.
        // The `web` group (not `api`) is what gives these routes a session
        // to authenticate against when opened directly in a browser.
        if ($this->app->environment(ContractPreviewController::ENVIRONMENTS)) {
            Route::prefix('dev')
                ->middleware('web')
                ->group(__DIR__.'/../../routes/dev.php');
        }
    }

    /**
     * Register the package's console commands.
     *
     * Laravel's default command auto-discovery scans app_path('Console/Commands'),
     * which only resolves into this package's own src/Console/Commands when
     * running standalone (bootstrap/app.php calls useAppPath() for local dev).
     * In a consuming app, app_path() points elsewhere, so these commands must
     * be registered explicitly or they silently disappear outside this repo.
     */
    protected function registerCommands(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([
                SeedDatabase::class,
                SmokeTestMailViews::class,
                SmokeTestAuthConfig::class,
                ProcessContractSigningReminders::class,
                SyncTiervermittlung::class,
                ReconcileTiervermittlung::class,
                CheckTiervermittlung::class,
            ]);
        }
    }

    /**
     * Register the admin middleware alias.
     */
    protected function registerMiddlewareAlias(): void
    {
        $this->callAfterResolving(Router::class, function (Router $router) {
            $router->aliasMiddleware('admin', EnsureUserIsAdmin::class);
            $router->aliasMiddleware('ability', CheckAbilities::class);
            $router->aliasMiddleware('abilities', CheckForAnyAbility::class);
        });
    }

    /**
     * Global and group middleware the package relies on.
     *
     * This lives here rather than in bootstrap/app.php because an install's
     * bootstrap/app.php comes from the taily-app scaffold and is never
     * touched again by `composer update` — anything configured there drifts
     * from the package as soon as the package changes.
     */
    protected function registerMiddleware(): void
    {
        $kernel = $this->app->make(Kernel::class);

        // What `->statefulApi()` does in bootstrap/app.php.
        $kernel->prependMiddlewareToGroup('api', EnsureFrontendRequestsAreStateful::class);
        $kernel->appendMiddlewareToGroup('api', SetReferrerPolicyHeader::class);

        // String fields default to '' rather than null (see
        // docs/coding-patterns/empty-strings.md), so request input must keep
        // empty strings as they are.
        ConvertEmptyStringsToNull::skipWhen(fn () => true);

        // invitations/*/accept has no prior GET on the same session to
        // anchor a CSRF token to. The public signing/inspection submissions
        // do have one (via EnsureFrontendRequestsAreStateful on their GET
        // routes) and stay protected, so a forged cross-site submission
        // cannot attribute someone else's IP/user-agent to a signature or
        // verdict in the audit trail.
        ValidateCsrfToken::except([
            'internal/invitations/*/accept',
        ]);
    }

    /**
     * Register the package's scheduled tasks.
     *
     * Requires an operator-configured cron entry invoking `schedule:run`
     * every minute — see docs/release-architecture.md. No queue worker
     * involved, per ADR-012 Constraint 1 (no background worker
     * infrastructure).
     */
    protected function registerSchedule(): void
    {
        $this->callAfterResolving(Schedule::class, function (Schedule $schedule): void {
            // Daily is enough slack for the 2-day-out reminder window.
            $schedule->command('contracts:process-reminders')->daily();
            // Both exit right away on installs without the export configured.
            $schedule->command('tiervermittlung:sync')->everyFiveMinutes()->withoutOverlapping();
            $schedule->command('tiervermittlung:reconcile')->dailyAt('03:30')->withoutOverlapping();
        });
    }

    /**
     * Force ForceJsonResponse to always run before auth middleware.
     *
     * It isn't itself a priority-listed middleware, so without this it can
     * get leapfrogged: Laravel's priority sort (see SortedMiddleware) only
     * reorders middleware that appear in Kernel::$middlewarePriority, and it
     * moves a later priority middleware to sit right before an earlier one
     * it was originally behind — jumping over any non-priority middleware
     * (like ours) in between. Sanctum's EnsureFrontendRequestsAreStateful
     * registers itself the same way (prependToMiddlewarePriority), which is
     * exactly what caused this leapfrogging for `auth:sanctum` routes.
     */
    protected function registerMiddlewarePriority(): void
    {
        $this->app->make(Kernel::class)->prependToMiddlewarePriority(ForceJsonResponse::class);
    }

    /**
     * A signed contract-download URL stays valid (and replayable) for an
     * hour, so anyone who obtains one — e.g. via a browser history, proxy
     * log, or leaked link — could otherwise trigger unlimited PDF renders.
     * Keying by the signature itself (rather than IP) bounds each distinct
     * link regardless of how many source IPs the requests come from.
     */
    protected function registerRateLimiters(): void
    {
        RateLimiter::for('contract-download', function (Request $request) {
            return Limit::perMinute(10)->by($request->query('signature', $request->ip()));
        });

        // Guards the public signing-token endpoints against brute-forcing or
        // automated abuse of a specific token. Keyed by the token itself
        // (not IP) so a single leaked/guessed token can't be hammered from
        // many source IPs, and so other signers' links aren't affected. The
        // added IP limit closes the gap where an attacker who controls the
        // (invalid) token value could otherwise open a fresh 20/minute
        // bucket per guess and bypass the per-token limit entirely.
        RateLimiter::for('contract-sign', function (Request $request) {
            return [
                Limit::perMinute(20)->by('contract-sign-token:'.$request->route('token')),
                Limit::perMinute(60)->by('contract-sign-ip:'.$request->ip()),
            ];
        });

        // Same dual-bucket shape as contract-sign, for the pre-inspection
        // submission endpoints, which previously had no throttle at all.
        // Public applications and the applicant portal. Login links are also
        // limited per email, so nobody can flood an inbox; applications are
        // limited per email in ApplicantPortal::apply().
        RateLimiter::for('applicant', function (Request $request) {
            $limits = [Limit::perMinute(60)->by('applicant-ip:'.$request->ip())];

            if ($request->isMethod('post') && $request->path() === 'internal/portal/login') {
                $email = $request->input('email');
                $email = is_string($email) ? mb_strtolower(trim($email)) : '';
                $limits[] = Limit::perMinute(3)->by('applicant-email:'.$email);
                $limits[] = Limit::perDay(10)->by('applicant-email-day:'.$email);
            }

            if ($request->isMethod('post') && $request->route('animal') !== null) {
                $limits[] = Limit::perMinute(5)->by('applicant-apply-ip:'.$request->ip());
            }

            return $limits;
        });

        RateLimiter::for('inspect', function (Request $request) {
            return [
                Limit::perMinute(20)->by('inspect-token:'.$request->route('token')),
                Limit::perMinute(60)->by('inspect-ip:'.$request->ip()),
            ];
        });
    }

    protected function configureMediaLibrary(): void
    {
        config([
            'media-library.url_generator' => MediaUrlGenerator::class,
            'media-library.queue_conversions_by_default' => false,
            'media-library.max_file_size' => UploadLimits::maxBytes(),
        ]);
    }

    protected function registerFilesystemDisks(): void
    {
        $disks = ['animal-pictures', 'person-pictures', 'adoption-contract'];

        foreach ($disks as $disk) {
            if (! config("filesystems.disks.{$disk}")) {
                config(["filesystems.disks.{$disk}" => [
                    'driver' => 'local',
                    'root' => storage_path("app/{$disk}"),
                    'throw' => false,
                    'report' => false,
                ]]);
            }
        }
    }
}
