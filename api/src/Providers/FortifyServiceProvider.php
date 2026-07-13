<?php

namespace Taily\Providers;

use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Laravel\Fortify\Contracts\FailedPasswordResetLinkRequestResponse as FailedPasswordResetLinkRequestResponseContract;
use Laravel\Fortify\Contracts\FailedPasswordResetResponse as FailedPasswordResetResponseContract;
use Laravel\Fortify\Contracts\PasswordUpdateResponse as PasswordUpdateResponseContract;
use Laravel\Fortify\Contracts\SuccessfulPasswordResetLinkRequestResponse as SuccessfulPasswordResetLinkRequestResponseContract;
use Laravel\Fortify\Events\TwoFactorAuthenticationConfirmed;
use Laravel\Fortify\Events\TwoFactorAuthenticationDisabled;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;
use Laravel\Passkeys\Events\PasskeyDeleted;
use Laravel\Passkeys\Events\PasskeyRegistered;
use Taily\Actions\Fortify\ResetUserPassword;
use Taily\Actions\Fortify\UpdateUserPassword;
use Taily\Http\Responses\FailedPasswordResetResponse;
use Taily\Http\Responses\PasswordResetLinkRequestedResponse;
use Taily\Http\Responses\PasswordUpdateResponse;
use Taily\Listeners\NotifyPasskeyDeleted;
use Taily\Listeners\NotifyPasskeyRegistered;
use Taily\Listeners\NotifyTwoFactorAuthenticationConfirmed;
use Taily\Listeners\NotifyTwoFactorAuthenticationDisabled;
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
        // Passkeys (WebAuthn) are opt-in per user, managed from personal
        // settings alongside 2FA. Registering and deleting a passkey are
        // gated by `password.confirm` (see routes/internal.php), matching the
        // `confirmPassword` option Fortify itself defaults to for passkeys.
        //
        // Fortify's own passkey routes are never registered — like every other
        // feature here, Taily registers the package's controllers itself in
        // routes/internal.php (see Fortify::ignoreRoutes() above, which also
        // covers the passkey routes Fortify would otherwise add).
        config([
            'fortify.views' => false,
            'fortify.features' => [
                Features::resetPasswords(),
                Features::updatePasswords(),
                Features::twoFactorAuthentication([
                    'confirm' => true,
                ]),
                Features::passkeys(),
            ],
        ]);

        // "Stay logged in" cookies would otherwise live for the framework's
        // 400-day default. Taily holds a lot of personal data (adopters,
        // fosters, home inspections), so cap the remember-me window at 30
        // days — long enough to be convenient, short enough that a forgotten
        // or stolen device ages out. A host application that has configured
        // its own duration on the guard keeps it.
        if (is_null(config('auth.guards.web.remember'))) {
            config(['auth.guards.web.remember' => 60 * 24 * 30]);
        }

        // Fortify's own service provider seeds passkeys.relying_party_id and
        // passkeys.allowed_origins from `app.url`, but WebAuthn ceremonies run
        // in the browser at the SPA's origin, not the API's — so the relying
        // party must be derived from the frontend URL instead. The allowed
        // origins are widened to the full CORS allow-list (config/cors.php) so
        // every environment the SPA is actually served from can complete a
        // ceremony, matching what already talks to the API with credentials.
        config([
            'passkeys.relying_party_id' => parse_url(config('taily.frontend_url'), PHP_URL_HOST),
            'passkeys.allowed_origins' => array_values(array_unique([
                ...config('cors.allowed_origins', []),
                config('taily.frontend_url'),
            ])),
        ]);

        Fortify::updateUserPasswordsUsing(UpdateUserPassword::class);
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);

        Event::listen(Login::class, UpdateLastLoginTimestamp::class);

        // TwoFactorAuthenticationEnabled fires as soon as a secret is
        // generated, before the user has confirmed it with a valid code, so
        // it's not notified on here — 2FA isn't actually protecting the
        // account yet at that point (see the `confirm` feature option above).
        Event::listen(TwoFactorAuthenticationConfirmed::class, NotifyTwoFactorAuthenticationConfirmed::class);
        Event::listen(TwoFactorAuthenticationDisabled::class, NotifyTwoFactorAuthenticationDisabled::class);

        Event::listen(PasskeyRegistered::class, NotifyPasskeyRegistered::class);
        Event::listen(PasskeyDeleted::class, NotifyPasskeyDeleted::class);
    }
}
