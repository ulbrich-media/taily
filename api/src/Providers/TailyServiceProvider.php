<?php

namespace Taily\Providers;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use Taily\Http\Middleware\EnsureUserIsAdmin;
use Taily\Http\Middleware\PublicApiCors;
use Taily\Models\User;

class TailyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../../config/taily.php', 'taily');
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../../database/migrations');
        $this->loadViewsFrom(__DIR__.'/../../resources/views', 'taily');

        JsonResource::withoutWrapping();
        config(['auth.providers.users.model' => User::class]);

        $this->registerRoutes();
        $this->registerMiddlewareAlias();

        $this->publishes([
            __DIR__.'/../../public/dist' => public_path(),
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
            ->middleware(['api', PublicApiCors::class])
            ->group(__DIR__.'/../../routes/api.php');

        Route::prefix('internal')
            ->middleware(['api', EnsureFrontendRequestsAreStateful::class])
            ->group(__DIR__.'/../../routes/internal.php');
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
}
