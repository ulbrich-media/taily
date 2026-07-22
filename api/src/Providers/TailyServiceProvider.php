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
use Taily\Support\MediaUrlGenerator;

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

        $this->registerFilesystemDisks();
        $this->configureMediaLibrary();

        JsonResource::withoutWrapping();
        config(['auth.providers.users.model' => User::class]);

        $this->registerRoutes();
        $this->registerMiddlewareAlias();

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
