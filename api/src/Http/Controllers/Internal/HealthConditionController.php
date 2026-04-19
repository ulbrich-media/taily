<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Taily\Http\Controllers\Controller;
use Taily\Http\Resources\HealthConditionResource;
use Taily\Models\HealthCondition;

class HealthConditionController extends Controller
{
    /**
     * Apply middleware to protect write operations.
     */
    public function __construct()
    {
        $this->middleware('admin')->only(['store', 'update', 'destroy']);
    }

    /**
     * Display a listing of health conditions.
     */
    public function index(Request $request): JsonResponse
    {
        $query = HealthCondition::with('animalType')->orderBy('name');

        if ($request->has('animal_type_id')) {
            $query->where('animal_type_id', $request->input('animal_type_id'));
        }

        return response()->json(HealthConditionResource::collection($query->get()));
    }

    /**
     * Store a newly created health condition in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'animal_type_id' => 'required|uuid|exists:animal_types,id',
        ]);

        $healthCondition = HealthCondition::create($validated);
        $healthCondition->load('animalType');

        return response()->json([
            'message' => 'Gesundheitszustand erfolgreich angelegt.',
            'data' => new HealthConditionResource($healthCondition),
        ], 201);
    }

    /**
     * Display the specified health condition.
     */
    public function show(HealthCondition $healthCondition): JsonResponse
    {
        $healthCondition->load('animalType');

        return response()->json(new HealthConditionResource($healthCondition));
    }

    /**
     * Update the specified health condition in storage.
     */
    public function update(Request $request, HealthCondition $healthCondition): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'animal_type_id' => 'required|uuid|exists:animal_types,id',
        ]);

        $healthCondition->update($validated);
        $healthCondition->load('animalType');

        return response()->json([
            'message' => 'Gesundheitszustand erfolgreich aktualisiert.',
            'data' => new HealthConditionResource($healthCondition),
        ]);
    }

    /**
     * Remove the specified health condition from storage.
     *
     * All animal assignments (vaccinations and tests) will be automatically removed due to cascade delete.
     */
    public function destroy(HealthCondition $healthCondition): JsonResponse
    {
        $healthCondition->delete();

        return response()->json([
            'message' => 'Gesundheitszustand erfolgreich gelöscht.',
        ]);
    }
}
