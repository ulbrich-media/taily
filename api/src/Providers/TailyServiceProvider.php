<?php

namespace Taily\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use Taily\Console\Commands\ProcessContractSigningReminders;
use Taily\Console\Commands\SeedDatabase;
use Taily\Console\Commands\SmokeTestAuthConfig;
use Taily\Console\Commands\SmokeTestMailViews;
use Taily\Http\Controllers\Dev\ContractPreviewController;
use Taily\Http\Middleware\EnsureUserIsAdmin;
use Taily\Http\Middleware\ForceJsonResponse;
use Taily\Http\Middleware\PublicApiCors;
use Taily\Models\User;
use Taily\Support\MediaUrlGenerator;

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

        $this->registerRoutes();
        $this->registerMiddlewareAlias();
        $this->registerMiddlewarePriority();
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
