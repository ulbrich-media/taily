<?php

namespace Taily\Actions\Fortify;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Laravel\Fortify\Contracts\ResetsUserPasswords;
use Taily\Mail\SecurityNotificationMail;
use Taily\Models\User;

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
        $user->save();

        Mail::to($user->email)->send(new SecurityNotificationMail(
            $user,
            'Dein Passwort wurde zurückgesetzt',
            'Das Passwort deines Kontos wurde über die "Passwort vergessen"-Funktion zurückgesetzt.'
        ));
    }
}
