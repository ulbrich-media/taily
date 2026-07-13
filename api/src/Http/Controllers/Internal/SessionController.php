<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Taily\Http\Controllers\Controller;
use Taily\Http\Resources\SessionResource;

/**
 * "Active sessions" listing for the security page: every row the database
 * session driver (see config/session.php) currently holds for the user, with
 * the ability to sign a device out by deleting its row.
 *
 * The `sessions.id` column is the session's own cookie value, so it is never
 * sent to the client as-is; a SHA-256 hash of it stands in as the public
 * identifier instead.
 *
 * Deleting a row alone is not enough to sign a device out: this app issues
 * 30-day "remember me" cookies (see FortifyServiceProvider), and a device
 * that still holds a valid one silently re-authenticates and recreates its
 * session row on its next request. `destroy()` and `destroyOthers()` rotate
 * the account's remember token first (the same recipe UpdateUserPassword
 * uses), which invalidates every device's remember cookie; the plaintext
 * password is required again so `logoutOtherDevices()` can safely re-issue
 * a fresh one for the calling device.
 */
class SessionController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $currentId = $request->session()->getId();
        $expiresAfter = now()->subMinutes((int) config('session.lifetime'))->timestamp;

        $sessions = DB::table('sessions')
            ->where('user_id', $request->user()->id)
            ->where('last_activity', '>=', $expiresAfter)
            ->orderByDesc('last_activity')
            ->get()
            ->each(function ($session) use ($currentId) {
                $session->is_current_device = $session->id === $currentId;
            });

        return SessionResource::collection($sessions);
    }

    public function destroy(Request $request, string $hashedId): JsonResponse
    {
        $target = DB::table('sessions')
            ->where('user_id', $request->user()->id)
            ->where('id', '!=', $request->session()->getId())
            ->get()
            ->first(fn ($session) => hash('sha256', $session->id) === $hashedId);

        if (! $target) {
            return response()->json([
                'message' => 'Sitzung nicht gefunden.',
            ], 404);
        }

        $request->validate([
            'password' => ['required', 'string', 'current_password:web'],
        ]);

        $this->rotateRememberToken($request);

        DB::table('sessions')->where('id', $target->id)->delete();

        return response()->json([
            'message' => 'Sitzung wurde abgemeldet.',
        ]);
    }

    public function destroyOthers(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'string', 'current_password:web'],
        ]);

        $this->rotateRememberToken($request);

        DB::table('sessions')
            ->where('user_id', $request->user()->id)
            ->where('id', '!=', $request->session()->getId())
            ->delete();

        return response()->json([
            'message' => 'Alle anderen Sitzungen wurden abgemeldet.',
        ]);
    }

    /**
     * Rotate the account's remember token so a signed-out device's "remember
     * me" cookie can no longer silently re-authenticate it. Must run before
     * the row deletion: `logoutOtherDevices()` re-queues *this* device's own
     * remember cookie (if it has one) from the in-memory user, so it keeps
     * working while every other device's cookie dies.
     */
    private function rotateRememberToken(Request $request): void
    {
        $user = $request->user();
        $user->setRememberToken(Str::random(60));

        // auth:sanctum resolves stateful SPA requests via the underlying
        // 'web' session guard, but logoutOtherDevices() only exists on that
        // concrete SessionGuard — not on Sanctum's RequestGuard wrapper.
        Auth::guard('web')->logoutOtherDevices($request->input('password'));

        $user->save();
    }
}
