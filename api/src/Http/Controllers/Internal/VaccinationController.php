<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Taily\Http\Controllers\Controller;
use Taily\Http\Resources\VaccinationResource;
use Taily\Models\Vaccination;

class VaccinationController extends Controller
{
    public function __construct()
    {
        $this->middleware('admin')->only(['store', 'update', 'destroy']);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Vaccination::with('animalType')->orderBy('title');

        if ($request->has('animal_type_id')) {
            $query->where('animal_type_id', $request->input('animal_type_id'));
        }

        return response()->json(VaccinationResource::collection($query->get()));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'sometimes|string|max:255',
            'animal_type_id' => 'required|uuid|exists:animal_types,id',
        ]);

        $vaccination = Vaccination::create($validated);
        $vaccination->load('animalType');

        return response()->json([
            'message' => 'Impfung erfolgreich angelegt.',
            'data' => new VaccinationResource($vaccination),
        ], 201);
    }

    public function show(Vaccination $vaccination): JsonResponse
    {
        $vaccination->load('animalType');

        return response()->json(new VaccinationResource($vaccination));
    }

    public function update(Request $request, Vaccination $vaccination): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'sometimes|string|max:255',
            'animal_type_id' => 'required|uuid|exists:animal_types,id',
        ]);

        $vaccination->update($validated);
        $vaccination->load('animalType');

        return response()->json([
            'message' => 'Impfung erfolgreich aktualisiert.',
            'data' => new VaccinationResource($vaccination),
        ]);
    }

    public function destroy(Vaccination $vaccination): JsonResponse
    {
        $vaccination->delete();

        return response()->json([
            'message' => 'Impfung erfolgreich gelöscht.',
        ]);
    }
}
