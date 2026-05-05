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

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'animal_id' => 'required|exists:animals,id',
            'mediator_id' => 'nullable|exists:people,id',
            'applicant_id' => 'required|exists:people,id',
            'application_notes' => 'sometimes|string',
        ]);

        $adoption = Adoption::create($validated);
        $adoption->load(['animal', 'mediator', 'applicant']);

        return response()->json([
            'message' => 'Vermittlung erfolgreich angelegt.',
            'data' => new AdoptionDetailResource($adoption),
        ], 201);
    }

    public function show(Adoption $adoption): AdoptionDetailResource
    {
        $adoption->load(['animal', 'animal.animalType', 'animal.media', 'mediator', 'mediator.media', 'applicant', 'applicant.media']);

        return new AdoptionDetailResource($adoption);
    }

    public function update(Request $request, Adoption $adoption): JsonResponse
    {
        $validated = $request->validate([
            'animal_id' => 'sometimes|required|exists:animals,id',
            'mediator_id' => 'sometimes|nullable|exists:people,id',
            'applicant_id' => 'sometimes|required|exists:people,id',
            'status' => 'sometimes|in:pending,in_progress,canceled,done',
            'canceled_at' => 'sometimes|nullable|date',
            'canceled_reason' => 'sometimes|string',
            'application_notes' => 'sometimes|string',
            'pre_inspection_notes' => 'sometimes|string',
            'contract_sent_at' => 'sometimes|nullable|date',
            'contract_signed' => 'sometimes|boolean',
            'contract_signed_at' => 'sometimes|nullable|date',
            'transport_id' => 'sometimes|nullable|exists:transports,id',
            'handed_over_at' => 'sometimes|nullable|date',
        ]);

        if ($request->has('contract_signed')) {
            $validated['contract_signed'] = $request->boolean('contract_signed');
        }

        $adoption->update($validated);
        $adoption->load(['animal', 'mediator', 'applicant']);

        return response()->json([
            'message' => 'Vermittlung erfolgreich aktualisiert.',
            'data' => new AdoptionDetailResource($adoption),
        ]);
    }

    public function destroy(Adoption $adoption): JsonResponse
    {
        $adoption->delete();

        return response()->json([
            'message' => 'Vermittlung erfolgreich gelöscht.',
        ]);
    }

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

        return response()->json([
            'animals' => AnimalListResource::collection($animals),
            'mediators' => PersonListResource::collection($mediators),
            'applicants' => PersonListResource::collection($applicants),
        ]);
    }
}
