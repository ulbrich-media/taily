<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;
use Taily\Http\Controllers\Controller;
use Taily\Http\Resources\AnimalDetailResource;
use Taily\Http\Resources\AnimalListResource;
use Taily\Models\Animal;

class AnimalController extends Controller
{
    /**
     * Display a listing of animals.
     * Supports filtering via query parameters:
     * - animal_type_id: Filter by specific animal type
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Animal::query();

        // Apply animal type filter if provided
        if ($request->has('animal_type_id')) {
            $query->where('animal_type_id', $request->input('animal_type_id'));
        }

        $animals = $query->with(['media', 'animalType'])->orderBy('intake_date', 'desc')->get();

        return AnimalListResource::collection($animals);
    }

    /**
     * Store a newly created animal in storage.
     * Only Tab 1: Basic & Description fields are required for creation.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'animal_type_id' => 'required|uuid|exists:animal_types,id',
            'animal_number' => 'nullable|string|max:255',
            'name' => 'required|string|max:255',
            'old_name' => 'nullable|string|max:255',
            'breed' => 'nullable|string|max:255',
            'gender' => 'required|in:male,female',
            'color' => 'nullable|string|max:255',
            'weight_grams' => 'nullable|integer|min:0',
            'size_cm' => 'nullable|integer|min:0',
            'date_of_birth' => 'nullable|date',
            'origin_country' => 'nullable|string|max:255',
            'is_boarding_animal' => 'boolean',
            'intake_date' => 'nullable|date',
            'character_description' => 'nullable|string',
            'contract_notes' => 'nullable|string',
            'internal_notes' => 'nullable|string',
        ]);

        $validated['is_boarding_animal'] = $request->boolean('is_boarding_animal');

        $animal = Animal::create($validated);

        $animal->load(['animalType', 'vaccinations', 'medicalTests', 'assignedAgent', 'owner', 'sponsor', 'adoptions', 'media']);

        return response()->json([
            'message' => 'Tier erfolgreich angelegt.',
            'data' => new AnimalDetailResource($animal),
        ], 201);
    }

    /**
     * Display the specified animal with all relationships.
     */
    public function show(Animal $animal): AnimalDetailResource
    {
        $animal->load([
            'animalType',
            'vaccinations',
            'medicalTests',
            'assignedAgent',
            'owner',
            'sponsor',
            'adoptions',
            'media',
        ]);

        return new AnimalDetailResource($animal);
    }

    /**
     * Update the specified animal in storage.
     * Accepts all fields.
     */
    public function update(Request $request, Animal $animal): JsonResponse
    {
        $validated = $request->validate([
            // Tab 1: Basic & Description
            'animal_type_id' => 'sometimes|required|uuid|exists:animal_types,id',
            'animal_number' => 'sometimes|string|max:255',
            'name' => 'sometimes|required|string|max:255',
            'old_name' => 'sometimes|nullable|string|max:255',
            'breed' => 'sometimes|nullable|string|max:255',
            'gender' => 'sometimes|required|in:male,female',
            'color' => 'sometimes|nullable|string|max:255',
            'weight_grams' => 'sometimes|nullable|integer|min:0',
            'size_cm' => 'sometimes|nullable|integer|min:0',
            'date_of_birth' => 'sometimes|nullable|date',
            'origin_country' => 'sometimes|nullable|string|max:255',
            'is_boarding_animal' => 'sometimes|boolean',
            'intake_date' => 'sometimes|nullable|date',
            'character_description' => 'sometimes|nullable|string',
            'contract_notes' => 'sometimes|nullable|string',
            'internal_notes' => 'sometimes|nullable|string',
            // Tab 2: Health & Identification
            'is_neutered' => 'sometimes|boolean',
            'health_description' => 'sometimes|nullable|string',
            'tasso_id' => 'sometimes|nullable|string|max:255',
            'findefix_id' => 'sometimes|nullable|string|max:255',
            'trace_id' => 'sometimes|nullable|string|max:255',
            // Tab 3: Placement, Contract & Costs
            'assigned_agent_id' => 'sometimes|nullable|uuid|exists:people,id',
            'origin_organization' => 'sometimes|nullable|string|max:255',
            'owner_id' => 'sometimes|nullable|uuid|exists:people,id',
            'adoption_fee' => 'sometimes|nullable|numeric|min:0',
            'monthly_boarding_cost' => 'sometimes|nullable|numeric|min:0',
            'monthly_sponsorship' => 'sometimes|nullable|numeric|min:0',
            'sponsor_id' => 'sometimes|nullable|uuid|exists:people,id',
            'sponsor_external' => 'sometimes|nullable|string|max:255',
            // Tab 4: Organization, Marketing & Status
            'current_location' => 'sometimes|nullable|string|max:255',
            'alternate_transport_trace' => 'sometimes|nullable|string|max:255',
            'alternate_arrival_location' => 'sometimes|nullable|string|max:255',
            'do_publish' => 'sometimes|boolean',
            'publish_description' => 'sometimes|nullable|string',
            'application_url' => 'sometimes|nullable|url|max:2048',
            'is_deceased' => 'sometimes|boolean',
            'date_of_death' => 'sometimes|nullable|date_format:Y-m-d',
            // Vaccinations and Tests
            'vaccinations' => 'sometimes|array',
            'vaccinations.*.vaccination_id' => ['required', 'uuid', Rule::exists('vaccinations', 'id')->where('animal_type_id', $animal->animal_type_id)],
            'vaccinations.*.vaccinated_at' => 'sometimes|nullable|date',
            'tests' => 'sometimes|array',
            'tests.*.medical_test_id' => ['required', 'uuid', Rule::exists('medical_tests', 'id')->where('animal_type_id', $animal->animal_type_id)],
            'tests.*.tested_at' => 'sometimes|nullable|date',
            'tests.*.result' => 'required|in:positive,negative',
        ]);

        $animal->update($validated);

        // Sync vaccinations if provided
        if ($request->has('vaccinations')) {
            $vaccinationData = collect($validated['vaccinations'])->mapWithKeys(function ($vaccination) {
                return [$vaccination['vaccination_id'] => ['vaccinated_at' => $vaccination['vaccinated_at'] ?? null]];
            });
            $animal->vaccinations()->sync($vaccinationData);
        }

        // Sync tests if provided
        if ($request->has('tests')) {
            $testData = collect($validated['tests'])->mapWithKeys(function ($test) {
                return [$test['medical_test_id'] => [
                    'tested_at' => $test['tested_at'] ?? null,
                    'result' => $test['result'],
                ]];
            });
            $animal->medicalTests()->sync($testData);
        }

        $animal->load(['animalType', 'vaccinations', 'medicalTests', 'assignedAgent', 'owner', 'sponsor', 'adoptions', 'media']);

        return response()->json([
            'message' => 'Tier erfolgreich aktualisiert.',
            'data' => new AnimalDetailResource($animal),
        ]);
    }

    /**
     * Remove the specified animal from storage.
     */
    public function destroy(Animal $animal): JsonResponse
    {
        $animal->delete();

        return response()->json([
            'message' => 'Hund erfolgreich gelöscht.',
        ]);
    }
}
