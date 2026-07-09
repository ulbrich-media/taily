<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Taily\Http\Controllers\Controller;
use Taily\Http\Requests\UpdatePasswordRequest;

class PasswordController extends Controller
{
    /**
     * Update the authenticated user's password.
     */
    public function update(UpdatePasswordRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        // auth:sanctum resolves stateful SPA requests via the underlying 'web' session
        // guard, but logoutOtherDevices() only exists on that concrete SessionGuard —
        // not on Sanctum's RequestGuard wrapper — so it must be called on 'web' directly.
        // Must run before the password attribute is swapped below: logoutOtherDevices()
        // re-checks the given plaintext against the user's *current* stored hash.
        Auth::guard('web')->logoutOtherDevices($validated['current_password']);

        $user->password = $validated['password'];
        $user->save();

        return response()->json([
            'message' => 'Passwort erfolgreich geändert.',
        ]);
    }
}
