<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Taily\Http\Controllers\Controller;
use Taily\Http\Requests\AcceptInvitationRequest;
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

    public function accept(AcceptInvitationRequest $request, string $token): JsonResponse
    {
        $invitation = UserInvitation::findByToken($token);

        if (! $invitation) {
            return response()->json([
                'message' => 'Einladung nicht gefunden oder abgelaufen.',
            ], 404);
        }

        $validated = $request->validated();

        $user = $invitation->user;
        $user->name = $validated['name'];
        $user->password = $validated['password'];
        $user->save();

        $invitation->markAsAccepted();

        return response()->json([
            'message' => 'Einladung erfolgreich angenommen. Sie können sich jetzt anmelden.',
        ]);
    }
}
