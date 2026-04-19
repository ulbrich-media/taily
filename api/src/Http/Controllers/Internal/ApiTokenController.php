<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Taily\Http\Controllers\Controller;

class ApiTokenController extends Controller
{
    /**
     * Available token abilities/scopes
     */
    private const AVAILABLE_ABILITIES = [
        'animals:read:adoptable' => 'Lese verfügbare Tiere zum Adoptieren',
        'animals:read:types' => 'Lese verfügbare Tierarten',
    ];

    /**
     * Display a listing of the user's API tokens.
     */
    public function index(Request $request): JsonResponse
    {
        $tokens = $request->user()->tokens->map(function ($token) {
            return [
                'id' => $token->id,
                'name' => $token->name,
                'abilities' => $token->abilities,
                'last_used_at' => $token->last_used_at?->toIso8601String(),
                'created_at' => $token->created_at->toIso8601String(),
            ];
        });

        return response()->json([
            'data' => $tokens,
            'available_abilities' => self::AVAILABLE_ABILITIES,
        ]);
    }

    /**
     * Store a newly created API token.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'abilities' => 'required|array|min:1',
            'abilities.*' => 'required|string|in:'.implode(',', array_keys(self::AVAILABLE_ABILITIES)),
        ]);

        $token = $request->user()->createToken(
            $validated['name'],
            $validated['abilities']
        );

        return response()->json([
            'message' => 'API Token erfolgreich erstellt.',
            'data' => [
                'id' => $token->accessToken->id,
                'name' => $token->accessToken->name,
                'abilities' => $token->accessToken->abilities,
                'token' => $token->plainTextToken,
                'created_at' => $token->accessToken->created_at->toIso8601String(),
            ],
        ], 201);
    }

    /**
     * Remove the specified API token.
     */
    public function destroy(Request $request, string $tokenId): JsonResponse
    {
        $deleted = $request->user()->tokens()->where('id', $tokenId)->delete();

        if (! $deleted) {
            return response()->json([
                'message' => 'Token nicht gefunden.',
            ], 404);
        }

        return response()->json([
            'message' => 'API Token erfolgreich gelöscht.',
        ]);
    }

    /**
     * Get available token abilities/scopes.
     */
    public function abilities(): JsonResponse
    {
        return response()->json([
            'data' => self::AVAILABLE_ABILITIES,
        ]);
    }
}
