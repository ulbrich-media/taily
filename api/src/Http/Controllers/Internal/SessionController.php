<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Taily\Http\Controllers\Controller;

/**
 * "Active sessions" listing for the security page: every row the database
 * session driver (see config/session.php) currently holds for the user, with
 * the ability to sign a device out by deleting its row. Deleting a row is
 * enough to log that device out on its next request — the session middleware
 * finds no matching session and starts a fresh, unauthenticated one.
 *
 * The `sessions.id` column is the session's own cookie value, so it is never
 * sent to the client as-is; a SHA-256 hash of it stands in as the public
 * identifier instead.
 */
class SessionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $currentId = $request->session()->getId();

        $sessions = DB::table('sessions')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('last_activity')
            ->get();

        return response()->json([
            'data' => $sessions->map(fn ($session) => [
                'id' => hash('sha256', $session->id),
                'ip_address' => $session->ip_address,
                'browser' => self::guessBrowser($session->user_agent),
                'platform' => self::guessPlatform($session->user_agent),
                'is_current_device' => $session->id === $currentId,
                'last_active_at' => date(DATE_ATOM, $session->last_activity),
            ]),
        ]);
    }

    public function destroy(Request $request, string $hashedId): JsonResponse
    {
        $deleted = DB::table('sessions')
            ->where('user_id', $request->user()->id)
            ->where('id', '!=', $request->session()->getId())
            ->get()
            ->first(fn ($session) => hash('sha256', $session->id) === $hashedId);

        if (! $deleted) {
            return response()->json([
                'message' => 'Sitzung nicht gefunden.',
            ], 404);
        }

        DB::table('sessions')->where('id', $deleted->id)->delete();

        return response()->json([
            'message' => 'Sitzung wurde abgemeldet.',
        ]);
    }

    public function destroyOthers(Request $request): JsonResponse
    {
        DB::table('sessions')
            ->where('user_id', $request->user()->id)
            ->where('id', '!=', $request->session()->getId())
            ->delete();

        return response()->json([
            'message' => 'Alle anderen Sitzungen wurden abgemeldet.',
        ]);
    }

    /**
     * Rough browser guess from the user agent string. Good enough for a
     * device list; not meant to be a full UA parser.
     */
    private static function guessBrowser(?string $userAgent): ?string
    {
        if (! $userAgent) {
            return null;
        }

        return match (true) {
            (bool) preg_match('/Edg\//', $userAgent) => 'Edge',
            (bool) preg_match('/OPR\/|Opera/', $userAgent) => 'Opera',
            (bool) preg_match('/Firefox\//', $userAgent) => 'Firefox',
            (bool) preg_match('/CriOS\//', $userAgent) => 'Chrome',
            (bool) preg_match('/Chrome\//', $userAgent) => 'Chrome',
            (bool) preg_match('/Safari\//', $userAgent) => 'Safari',
            default => null,
        };
    }

    /**
     * Rough OS/platform guess from the user agent string.
     */
    private static function guessPlatform(?string $userAgent): ?string
    {
        if (! $userAgent) {
            return null;
        }

        return match (true) {
            (bool) preg_match('/iPhone|iPad|iPod/', $userAgent) => 'iOS',
            (bool) preg_match('/Android/', $userAgent) => 'Android',
            (bool) preg_match('/Mac OS X/', $userAgent) => 'macOS',
            (bool) preg_match('/Windows/', $userAgent) => 'Windows',
            (bool) preg_match('/Linux/', $userAgent) => 'Linux',
            default => null,
        };
    }
}
