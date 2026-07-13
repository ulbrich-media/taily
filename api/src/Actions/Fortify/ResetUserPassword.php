<?php

namespace Taily\Actions\Fortify;

use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Laravel\Fortify\Contracts\ResetsUserPasswords;
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

        // A "stay logged in" cookie authenticates via the remember token alone
        // (Sanctum's AuthenticateSession never checks the password hash it
        // carries), so the token must be rotated here — otherwise a stolen
        // remember cookie would survive the very reset meant to lock it out.
        $user->setRememberToken(Str::random(60));

        $user->save();
    }
}
