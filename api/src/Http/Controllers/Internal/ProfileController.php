<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Taily\Http\Controllers\Controller;
use Taily\Models\PendingEmailChange;
use Taily\Models\User;

class ProfileController extends Controller
{
    /**
     * Get the authenticated user's profile.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        // Queried directly rather than via the pendingEmailChange() relation:
        // loading the relation would also surface it (with its own id/token/
        // timestamps) as a raw "pending_email_change" key in $user->toArray()
        // below, duplicating the curated "pending_email" key added here.
        $pending = PendingEmailChange::where('user_id', $user->id)->first();

        return response()->json([
            ...$user->toArray(),
            // Confirmed second factor only. A generated-but-unconfirmed secret
            // does not gate login, so the SPA treats it as "not enabled".
            'two_factor_enabled' => ! is_null($user->two_factor_confirmed_at),
            'pending_email' => optional($pending)->only(['new_email', 'expires_at']),
        ]);
    }

    /**
     * Update the authenticated user's profile.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $user = $request->user();
        $user->fill($validated);

        $user->save();

        return response()->json([
            'message' => 'Profil erfolgreich aktualisiert.',
            'data' => $user,
        ]);
    }
}
