<?php

namespace Taily\Providers;

use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Laravel\Fortify\Contracts\PasswordUpdateResponse as PasswordUpdateResponseContract;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;
use Taily\Actions\Fortify\ResetUserPassword;
use Taily\Actions\Fortify\UpdateUserPassword;
use Taily\Http\Responses\PasswordUpdateResponse;
use Taily\Listeners\UpdateLastLoginTimestamp;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Taily registers only the Fortify endpoints it needs in
        // routes/internal.php, so Fortify must not claim routes on its own —
        // especially not in a host application that installs this package.
        Fortify::ignoreRoutes();

        $this->app->singleton(PasswordUpdateResponseContract::class, PasswordUpdateResponse::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // The internal API is consumed by the SPA only; users are onboarded
        // via invitations, so registration and Fortify's other features stay
        // disabled until they are deliberately adopted.
        config([
            'fortify.views' => false,
            'fortify.features' => [
                Features::resetPasswords(),
                Features::updatePasswords(),
            ],
        ]);

        Fortify::updateUserPasswordsUsing(UpdateUserPassword::class);
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);

        Event::listen(Login::class, UpdateLastLoginTimestamp::class);
    }
}
