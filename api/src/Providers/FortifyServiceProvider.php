<?php

namespace Taily\Providers;

use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Laravel\Fortify\Contracts\FailedPasswordResetLinkRequestResponse as FailedPasswordResetLinkRequestResponseContract;
use Laravel\Fortify\Contracts\FailedPasswordResetResponse as FailedPasswordResetResponseContract;
use Laravel\Fortify\Contracts\PasswordUpdateResponse as PasswordUpdateResponseContract;
use Laravel\Fortify\Contracts\SuccessfulPasswordResetLinkRequestResponse as SuccessfulPasswordResetLinkRequestResponseContract;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;
use Taily\Actions\Fortify\ResetUserPassword;
use Taily\Actions\Fortify\UpdateUserPassword;
use Taily\Http\Responses\FailedPasswordResetResponse;
use Taily\Http\Responses\PasswordResetLinkRequestedResponse;
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

        // Anti-enumeration: reset link requests always answer generically and
        // failed resets never reveal whether the email exists.
        $this->app->singleton(SuccessfulPasswordResetLinkRequestResponseContract::class, PasswordResetLinkRequestedResponse::class);
        $this->app->singleton(FailedPasswordResetLinkRequestResponseContract::class, PasswordResetLinkRequestedResponse::class);
        $this->app->singleton(FailedPasswordResetResponseContract::class, FailedPasswordResetResponse::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // The internal API is consumed by the SPA only; users are onboarded
        // via invitations, so registration and Fortify's other features stay
        // disabled until they are deliberately adopted.
        //
        // Two-factor authentication (TOTP) is opt-in per user and set up from
        // the personal settings. `confirm` requires the user to verify a code
        // before the second factor becomes active, so a mistyped authenticator
        // secret can never lock anyone out.
        //
        // Re-authentication before the sensitive 2FA operations is enforced with
        // the `password.confirm` middleware applied directly to the routes in
        // routes/internal.php. Fortify's own `confirmPassword` feature option
        // only affects the routes Fortify registers, and Taily registers these
        // explicitly (see Fortify::ignoreRoutes()), so the guard lives with the
        // routes rather than in this config.
        //
        // Passkeys (`Features::passkeys()`, available via laravel/passkeys which
        // Fortify pulls in) are intentionally left disabled here; they extend
        // both the login and settings flows with a WebAuthn ceremony layer and
        // are tracked as separate follow-up work.
        config([
            'fortify.views' => false,
            'fortify.features' => [
                Features::resetPasswords(),
                Features::updatePasswords(),
                Features::twoFactorAuthentication([
                    'confirm' => true,
                ]),
            ],
        ]);

        Fortify::updateUserPasswordsUsing(UpdateUserPassword::class);
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);

        Event::listen(Login::class, UpdateLastLoginTimestamp::class);
    }
}
