<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Taily\Http\Controllers\Controller;
use Taily\Http\Resources\AdoptionDetailResource;
use Taily\Http\Resources\AdoptionListResource;
use Taily\Http\Resources\AnimalListResource;
use Taily\Http\Resources\PersonListResource;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\Person;

class AdoptionController extends Controller
{
    /**
     * Display a listing of adoptions.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $adoptions = Adoption::with(['animal', 'animal.animalType', 'animal.media', 'mediator', 'mediator.media', 'applicant', 'applicant.media'])
            ->when($request->filled('animal_id'), fn ($q) => $q->where('animal_id', $request->input('animal_id')))
            ->when($request->filled('mediator_id'), fn ($q) => $q->where('mediator_id', $request->input('mediator_id')))
            ->when($request->filled('applicant_id'), fn ($q) => $q->where('applicant_id', $request->input('applicant_id')))
            ->orderBy('created_at', 'desc')
            ->get();

        return AdoptionListResource::collection($adoptions);
    }

    /**
     * Store a newly created adoption in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'animal_id' => 'required|exists:animals,id',
            'mediator_id' => 'nullable|exists:people,id',
            'applicant_id' => 'required|exists:people,id',
        ]);

        $adoption = Adoption::create($validated);
        $adoption->load(['animal', 'mediator', 'applicant', 'inspector']);

        return response()->json([
            'message' => 'Vermittlung erfolgreich angelegt.',
            'data' => new AdoptionDetailResource($adoption),
        ], 201);
    }

    /**
     * Display the specified adoption.
     */
    public function show(Adoption $adoption): AdoptionDetailResource
    {
        $adoption->load(['animal', 'animal.animalType', 'animal.media', 'mediator', 'mediator.media', 'applicant', 'applicant.media', 'inspector']);

        return new AdoptionDetailResource($adoption);
    }

    /**
     * Update the specified adoption in storage.
     */
    public function update(Request $request, Adoption $adoption): JsonResponse
    {
        $validated = $request->validate([
            'animal_id' => 'sometimes|required|exists:animals,id',
            'mediator_id' => 'sometimes|nullable|exists:people,id',
            'applicant_id' => 'sometimes|required|exists:people,id',
            'inspector_id' => 'sometimes|nullable|exists:people,id',
            'pre_inspection_result' => 'sometimes|in:not_conducted,approved,rejected',
            'pre_inspection_summary' => 'sometimes|string',
            'contract_sent_at' => 'sometimes|nullable|date',
            'contract_signed' => 'sometimes|boolean',
            'transfer_planned_at' => 'sometimes|nullable|date',
            'transferred_at' => 'sometimes|nullable|date',
        ]);

        $validated['contract_signed'] = $request->boolean('contract_signed');

        $adoption->update($validated);
        $adoption->load(['animal', 'mediator', 'applicant', 'inspector']);

        return response()->json([
            'message' => 'Vermittlung erfolgreich aktualisiert.',
            'data' => new AdoptionDetailResource($adoption),
        ]);
    }

    /**
     * Remove the specified adoption from storage.
     */
    public function destroy(Adoption $adoption): JsonResponse
    {
        $adoption->delete();

        return response()->json([
            'message' => 'Vermittlung erfolgreich gelöscht.',
        ]);
    }

    /**
     * Get dropdown options for creating/editing adoptions.
     */
    public function options(): JsonResponse
    {
        $animals = Animal::with('media')->orderBy('name')->get();
        $mediators = Person::with('media')->whereHas('mediatorAnimalTypes')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();
        $applicants = Person::with('media')->orderBy('last_name')
            ->orderBy('first_name')
            ->get();
        $inspectors = Person::with('media')->whereHas('inspectorAnimalTypes')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        return response()->json([
            'animals' => AnimalListResource::collection($animals),
            'mediators' => PersonListResource::collection($mediators),
            'applicants' => PersonListResource::collection($applicants),
            'inspectors' => PersonListResource::collection($inspectors),
        ]);
    }
}
