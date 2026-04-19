<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;
use Taily\Http\Controllers\Controller;
use Taily\Http\Resources\PreInspectionDetailResource;
use Taily\Http\Resources\PreInspectionListResource;
use Taily\Models\Person;
use Taily\Models\PreInspection;

class PreInspectionController extends Controller
{
    /**
     * Display a listing of pre-inspections.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = PreInspection::with(['person', 'animalType', 'inspector', 'accessTokens'])
            ->orderBy('created_at', 'desc');

        $filters = $request->validate([
            'person_id' => 'sometimes|uuid',
            'animal_type_id' => 'sometimes|uuid',
        ]);

        if (isset($filters['person_id'])) {
            $query->where('person_id', $filters['person_id']);
        }

        if (isset($filters['animal_type_id'])) {
            $query->where('animal_type_id', $filters['animal_type_id']);
        }

        return PreInspectionListResource::collection($query->get());
    }

    /**
     * Store a newly created pre-inspection.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'person_id' => 'required|uuid|exists:people,id',
            'animal_type_id' => 'required|uuid|exists:animal_types,id',
            'inspector_id' => 'nullable|uuid|exists:people,id',
        ]);

        if (! empty($validated['inspector_id'])) {
            $eligible = Person::whereKey($validated['inspector_id'])
                ->whereHas('inspectorAnimalTypes', fn ($q) => $q->where('animal_types.id', $validated['animal_type_id']))
                ->exists();

            if (! $eligible) {
                throw ValidationException::withMessages([
                    'inspector_id' => 'Die gewählte Person ist für diese Tierart nicht als Kontrolleur hinterlegt.',
                ]);
            }
        }

        $inspection = new PreInspection;
        $inspection->person_id = $validated['person_id'];
        $inspection->animal_type_id = $validated['animal_type_id'];
        $inspection->inspector_id = $validated['inspector_id'] ?? null;
        $inspection->notes = '';
        $inspection->save();
        $inspection->issueToken(now()->addDays(30));

        $inspection->load(['person', 'animalType', 'inspector', 'accessTokens']);

        return response()->json([
            'message' => 'Vorkontrolle erfolgreich angelegt.',
            'data' => new PreInspectionDetailResource($inspection),
        ], 201);
    }

    /**
     * Display the specified pre-inspection.
     */
    public function show(PreInspection $preInspection): PreInspectionDetailResource
    {
        $preInspection->load(['person', 'animalType', 'inspector', 'accessTokens']);

        return new PreInspectionDetailResource($preInspection);
    }

    /**
     * Update the specified pre-inspection.
     */
    public function update(Request $request, PreInspection $preInspection): JsonResponse
    {
        $validated = $request->validate([
            'inspector_id' => 'nullable|uuid|exists:people,id',
            'notes' => 'string',
            'verdict' => 'in:pending,approved,rejected',
        ]);

        if (array_key_exists('inspector_id', $validated) && $validated['inspector_id'] !== null) {
            $eligible = Person::whereKey($validated['inspector_id'])
                ->whereHas('inspectorAnimalTypes', fn ($q) => $q->where('animal_types.id', $preInspection->animal_type_id))
                ->exists();

            if (! $eligible) {
                throw ValidationException::withMessages([
                    'inspector_id' => 'Die gewählte Person ist für diese Tierart nicht als Kontrolleur hinterlegt.',
                ]);
            }
        }

        $preInspection->inspector_id = array_key_exists('inspector_id', $validated)
            ? $validated['inspector_id']
            : $preInspection->inspector_id;
        $preInspection->verdict = array_key_exists('verdict', $validated)
            ? $validated['verdict']
            : $preInspection->verdict;
        $preInspection->notes = array_key_exists('notes', $validated) ? $validated['notes'] : $preInspection->notes;
        $preInspection->save();
        $preInspection->load(['person', 'animalType', 'inspector', 'accessTokens']);

        return response()->json([
            'message' => 'Vorkontrolle erfolgreich aktualisiert.',
            'data' => new PreInspectionDetailResource($preInspection),
        ]);
    }

    /**
     * Remove the specified pre-inspection.
     */
    public function destroy(PreInspection $preInspection): JsonResponse
    {
        $preInspection->delete();

        return response()->json([
            'message' => 'Vorkontrolle erfolgreich gelöscht.',
        ]);
    }
}
