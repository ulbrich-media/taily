<?php

namespace Taily\Actions\Fortify;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Laravel\Fortify\Contracts\ResetsUserPasswords;
use Taily\Mail\SecurityNotificationMail;
use Taily\Models\User;
use Throwable;

class ResetUserPassword implements ResetsUserPasswords
{
    /**
     * Validate and reset the user's forgotten password.
     *
     * @param  array<string, string>  $input
     */
    public function reset(User $user, array $input): void
    {
        Validator::make($input, [
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
        ])->validate();

        $user->password = $input['password'];

        // A "stay logged in" cookie authenticates via the remember token alone
        // (Sanctum's AuthenticateSession never checks the password hash it
        // carries), so the token must be rotated here — otherwise a stolen
        // remember cookie would survive the very reset meant to lock it out.
        $user->setRememberToken(Str::random(60));

        $user->save();

        // The password reset has already succeeded at this point, so a mail
        // delivery failure must not turn into a 500 for the user.
        try {
            Mail::to($user->email)->send(new SecurityNotificationMail(
                'Dein Passwort wurde zurückgesetzt',
                'Das Passwort deines Kontos wurde über die "Passwort vergessen"-Funktion zurückgesetzt.'
            ));
        } catch (Throwable $e) {
            Log::error('Failed to send password reset security notification', [
                'user_id' => $user->id,
                'exception' => $e,
            ]);
        }
    }
}
