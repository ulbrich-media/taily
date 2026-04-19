<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Taily\Http\Controllers\Controller;
use Taily\Http\Resources\AnimalTypeResource;
use Taily\Models\AnimalType;

class AnimalTypeController extends Controller
{
    public function __construct()
    {
        $this->middleware('admin')->only(['store', 'update', 'destroy']);
    }

    /**
     * Display a listing of animal types.
     */
    public function index(): JsonResponse
    {
        $animalTypes = AnimalType::with('formTemplate')->get();

        return response()->json([
            'data' => AnimalTypeResource::collection($animalTypes),
            'count' => $animalTypes->count(),
        ]);
    }

    /**
     * Store a newly created animal type.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255|unique:animal_types,title',
            'form_template_id' => 'nullable|uuid|exists:form_templates,id',
        ]);

        $animalType = AnimalType::create($validated);
        $animalType->load('formTemplate');

        return response()->json([
            'message' => 'Tierart erfolgreich angelegt.',
            'data' => new AnimalTypeResource($animalType),
        ], 201);
    }

    /**
     * Display the specified animal type.
     */
    public function show(AnimalType $animalType): JsonResponse
    {
        $animalType->load('formTemplate');

        return response()->json([
            'message' => 'Tierart gefunden.',
            'data' => new AnimalTypeResource($animalType),
        ]);
    }

    /**
     * Update the specified animal type.
     */
    public function update(Request $request, AnimalType $animalType): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255|unique:animal_types,title,'.$animalType->id,
            'form_template_id' => 'nullable|uuid|exists:form_templates,id',
        ]);

        $animalType->update($validated);
        $animalType->load('formTemplate');

        return response()->json([
            'message' => 'Tierart erfolgreich aktualisiert.',
            'data' => new AnimalTypeResource($animalType),
        ]);
    }

    /**
     * Remove the specified animal type.
     */
    public function destroy(AnimalType $animalType): JsonResponse
    {
        try {
            $animalType->delete();
        } catch (QueryException) {
            return response()->json([
                'message' => 'Diese Tierart kann nicht gelöscht werden, da ihr noch Tiere oder Vorkontrollen zugeordnet sind.',
            ], 422);
        }

        return response()->json([
            'message' => 'Tierart erfolgreich gelöscht.',
        ]);
    }
}
