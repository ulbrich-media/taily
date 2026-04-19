<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Taily\Http\Controllers\Controller;
use Taily\Models\UserInvitation;

class InvitationController extends Controller
{
    public function show(string $token): JsonResponse
    {
        $invitation = UserInvitation::findByToken($token);

        if (! $invitation) {
            return response()->json([
                'message' => 'Einladung nicht gefunden oder abgelaufen.',
            ], 404);
        }

        return response()->json([
            'email' => $invitation->user->email,
            'name' => $invitation->user->name,
            'expires_at' => $invitation->expires_at->toIso8601String(),
        ]);
    }

    public function accept(Request $request, string $token): JsonResponse
    {
        $invitation = UserInvitation::findByToken($token);

        if (! $invitation) {
            return response()->json([
                'message' => 'Einladung nicht gefunden oder abgelaufen.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $invitation->user;
        $user->name = $validated['name'];
        $user->password = Hash::make($validated['password']);
        $user->save();

        $invitation->markAsAccepted();

        return response()->json([
            'message' => 'Einladung erfolgreich angenommen. Sie können sich jetzt anmelden.',
        ]);
    }
}
