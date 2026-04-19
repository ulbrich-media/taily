<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Taily\Http\Controllers\Controller;
use Taily\Models\PreInspection;

class PreInspectionSubmissionController extends Controller
{
    /**
     * Display the pre-inspection data for public token access.
     */
    public function show(string $token): JsonResponse
    {
        $inspection = PreInspection::findByToken($token);

        if (! $inspection) {
            return response()->json([
                'message' => 'Diese Vorkontrolle wurde nicht gefunden, ist abgelaufen oder wurde bereits eingereicht.',
            ], 404);
        }

        $inspection->load(['person', 'animalType']);

        if (! $inspection->person) {
            return response()->json(['message' => 'Interessent nicht gefunden.'], 422);
        }

        if (! $inspection->animalType) {
            return response()->json(['message' => 'Tierart nicht gefunden.'], 422);
        }

        return response()->json([
            'id' => $inspection->id,
            'verdict' => $inspection->verdict,
            'notes' => $inspection->notes,
            'person' => [
                'id' => $inspection->person->id,
                'full_name' => $inspection->person->full_name,
                'first_name' => $inspection->person->first_name,
                'last_name' => $inspection->person->last_name,
                'street_line' => $inspection->person->street_line,
                'street_line_additional' => $inspection->person->street_line_additional,
                'postal_code' => $inspection->person->postal_code,
                'city' => $inspection->person->city,
                'country_code' => $inspection->person->country_code,
            ],
            'animal_type' => [
                'id' => $inspection->animalType->id,
                'title' => $inspection->animalType->title,
            ],
        ]);
    }

    /**
     * Submit inspection data via public token.
     */
    public function submit(Request $request, string $token): JsonResponse
    {
        $validated = $request->validate([
            'verdict' => 'required|in:approved,rejected',
            'notes' => 'nullable|string',
        ]);

        $submitted = DB::transaction(function () use ($token, $validated) {
            $inspection = PreInspection::whereHasValidToken($token)
                ->where('verdict', 'pending')
                ->lockForUpdate()
                ->first();

            if (! $inspection) {
                return false;
            }

            $inspection->verdict = $validated['verdict'];
            $inspection->notes = $validated['notes'] ?? null;
            $inspection->submitted_at = now();
            $inspection->save();

            return true;
        });

        if (! $submitted) {
            return response()->json([
                'message' => 'Diese Vorkontrolle wurde nicht gefunden, ist abgelaufen oder wurde bereits eingereicht.',
            ], 404);
        }

        return response()->json([
            'message' => 'Vorkontrolle erfolgreich eingereicht.',
        ]);
    }
}
