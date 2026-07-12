<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Taily\Http\Controllers\Controller;

class PasskeyController extends Controller
{
    /**
     * List the authenticated user's passkeys.
     *
     * Registration and deletion go through laravel/passkeys' own controllers
     * (see routes/internal.php); the package does not ship a listing endpoint,
     * so this one is Taily's own.
     */
    public function index(Request $request): JsonResponse
    {
        $passkeys = $request->user()->passkeys()->orderByDesc('created_at')->get();

        return response()->json([
            'data' => $passkeys->map(fn ($passkey) => [
                'id' => (string) $passkey->id,
                'name' => $passkey->name,
                'authenticator' => $passkey->authenticator,
                'last_used_at' => $passkey->last_used_at?->toIso8601String(),
                'created_at' => $passkey->created_at->toIso8601String(),
            ]),
        ]);
    }
}
