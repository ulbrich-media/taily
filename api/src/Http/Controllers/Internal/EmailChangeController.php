<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Taily\Http\Controllers\Controller;
use Taily\Mail\EmailChangeConfirmationMail;
use Taily\Mail\SecurityNotificationMail;
use Taily\Models\PendingEmailChange;
use Throwable;

class EmailChangeController extends Controller
{
    /**
     * Request a change of the authenticated user's email address. Sends a
     * confirmation link to the new address; the account's email does not
     * change until that link is clicked. Replaces any earlier pending
     * request for this user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
        ]);

        $user = $request->user();
        $pending = PendingEmailChange::createForUser($user, $validated['email']);

        Mail::to($pending->new_email)->send(new EmailChangeConfirmationMail($pending, $pending->plainTextToken));

        return response()->json([
            'message' => 'Bestätigungslink wurde an die neue E-Mail-Adresse gesendet.',
            'data' => $pending->only(['new_email', 'expires_at']),
        ]);
    }

    /**
     * Confirm a pending email change. Unauthenticated: the token itself is
     * the credential, the same trust model as password reset and invitation
     * accept links.
     */
    public function confirm(string $token): JsonResponse
    {
        $pending = PendingEmailChange::findByToken($token);

        if (! $pending) {
            return response()->json([
                'message' => 'Bestätigungslink nicht gefunden oder abgelaufen.',
            ], 404);
        }

        $user = $pending->user;
        $oldEmail = $user->email;

        $user->email = $pending->new_email;
        $user->save();

        $pending->delete();

        // The email change has already succeeded at this point, so a mail
        // delivery failure must not turn into a 500 for the user.
        try {
            Mail::to($oldEmail)->send(new SecurityNotificationMail(
                'Deine E-Mail-Adresse wurde geändert',
                "Die E-Mail-Adresse deines Kontos wurde von {$oldEmail} zu {$user->email} geändert."
            ));
        } catch (Throwable $e) {
            Log::error('Failed to send email change security notification', [
                'user_id' => $user->id,
                'exception' => $e,
            ]);
        }

        return response()->json([
            'message' => 'E-Mail-Adresse erfolgreich geändert.',
        ]);
    }

    /**
     * Cancel the authenticated user's pending email change, if any.
     */
    public function destroy(Request $request): JsonResponse
    {
        PendingEmailChange::where('user_id', $request->user()->id)->delete();

        return response()->json([
            'message' => 'Ausstehende Änderung wurde verworfen.',
        ]);
    }
}
