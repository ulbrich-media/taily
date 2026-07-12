<?php

namespace Taily\Actions\Fortify;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Laravel\Fortify\Contracts\UpdatesUserPasswords;
use Taily\Mail\SecurityNotificationMail;
use Taily\Models\User;
use Throwable;

class UpdateUserPassword implements UpdatesUserPasswords
{
    /**
     * Validate and update the user's password.
     *
     * @param  array<string, string>  $input
     */
    public function update(User $user, array $input): void
    {
        Validator::make($input, [
            'current_password' => ['required', 'string', 'current_password:web'],
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
        ])->validate();

        // auth:sanctum resolves stateful SPA requests via the underlying 'web' session
        // guard, but logoutOtherDevices() only exists on that concrete SessionGuard —
        // not on Sanctum's RequestGuard wrapper — so it must be called on 'web' directly.
        // Must run before the password attribute is swapped below: logoutOtherDevices()
        // re-checks the given plaintext against the user's *current* stored hash.
        Auth::guard('web')->logoutOtherDevices($input['current_password']);

        $user->password = $input['password'];
        $user->save();

        // The password change has already succeeded at this point, so a mail
        // delivery failure must not turn into a 500 for the user.
        try {
            Mail::to($user->email)->send(new SecurityNotificationMail(
                'Dein Passwort wurde geändert',
                'Das Passwort deines Kontos wurde soeben geändert. Alle anderen aktiven Sitzungen wurden dabei automatisch abgemeldet.'
            ));
        } catch (Throwable $e) {
            Log::error('Failed to send password change security notification', [
                'user_id' => $user->id,
                'exception' => $e,
            ]);
        }
    }
}
