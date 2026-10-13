<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Taily\Http\Controllers\Controller;
use Taily\Http\Requests\AdoptionIndexRequest;
use Taily\Http\Resources\AdoptionDetailResource;
use Taily\Http\Resources\AdoptionListResource;
use Taily\Http\Resources\AnimalListResource;
use Taily\Http\Resources\PersonListResource;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\Person;

class AdoptionController extends Controller
{
    private const DETAIL_RELATIONS = [
        'animal', 'animal.animalType', 'animal.media',
        'mediator', 'mediator.media',
        'applicant', 'applicant.media',
        'transport', 'transport.responsible', 'transport.responsible.media',
        'media',
        'latestContractSigningProcess.signers.person',
        'latestContractSigningProcess.signers.latestInviteEvent',
    ];

    // What an adoption row of the list renders, including its derived step statuses.
    private const LIST_RELATIONS = [
        'animal', 'animal.animalType', 'animal.media',
        'mediator.media', 'applicant.media',
        'transport',
        'latestContractSigningProcess',
        'preInspections',
    ];

    /**
     * Paginated, filtered, searched and sorted adoption list. Query contract:
     * docs/coding-patterns/list-views.md. `per_page=0` only counts the matches.
     */
    public function index(AdoptionIndexRequest $request): AnonymousResourceCollection|JsonResponse
    {
        $query = Adoption::query()
            ->filterBy($request->filters())
            ->search($request->searchTerm());

        if ($request->perPage() === 0) {
            return response()->json([
                'data' => [],
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 0,
                    'total' => $query->count(),
                ],
            ]);
        }

        $adoptions = $query
            ->with(self::LIST_RELATIONS)
            ->sortedBy($request->sortKey(), $request->sortDirection())
            ->paginate($request->perPage());

        return AdoptionListResource::collection($adoptions);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'animal_id' => 'required|exists:animals,id',
            'mediator_id' => 'nullable|exists:people,id',
            'applicant_id' => 'required|exists:people,id',
            'notes' => 'sometimes|string',
        ]);

        $adoption = Adoption::create($validated);
        $adoption->load(self::DETAIL_RELATIONS);

        return response()->json([
            'message' => 'Vermittlung erfolgreich angelegt.',
            'data' => new AdoptionDetailResource($adoption),
        ], 201);
    }

    public function show(Adoption $adoption): AdoptionDetailResource
    {
        $adoption->load(self::DETAIL_RELATIONS);

        return new AdoptionDetailResource($adoption);
    }

    public function update(Request $request, Adoption $adoption): JsonResponse
    {
        $validated = $request->validate([
            'animal_id' => 'sometimes|required|exists:animals,id',
            'mediator_id' => 'sometimes|nullable|exists:people,id',
            'applicant_id' => 'sometimes|required|exists:people,id',
            'status' => 'sometimes|in:pending,in_progress,canceled,done',
            'canceled_reason' => 'sometimes',
            'notes' => 'sometimes|string',
            'pre_inspection_notes' => 'sometimes|string',
            'transport_id' => 'sometimes|nullable|exists:transports,id',
            'handed_over_at' => 'sometimes|nullable|date',
        ]);

        // Server manages canceled_at: set it on cancel, clear it on reopen.
        $incomingStatus = $validated['status'] ?? null;
        if ($incomingStatus === 'canceled') {
            $validated['canceled_at'] = now();
        } elseif ($incomingStatus !== null) {
            $validated['canceled_at'] = null;
        }

        $adoption->update($validated);
        $adoption->load(self::DETAIL_RELATIONS);

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
