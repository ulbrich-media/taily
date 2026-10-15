<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Taily\Http\Controllers\Controller;
use Taily\Http\Requests\PersonIndexRequest;
use Taily\Http\Resources\PersonDetailResource;
use Taily\Http\Resources\PersonListResource;
use Taily\Models\Person;

class PersonController extends Controller
{
    private const LIST_RELATIONS = ['organization', 'inspectorAnimalTypes', 'mediatorAnimalTypes', 'fosterAnimalTypes', 'media'];

    /**
     * Display a page of people (see PersonIndexRequest for the query
     * contract). `per_page=0` only counts the filtered people. Without any
     * list parameter the whole directory is returned, which the pickers in
     * other forms still rely on.
     */
    public function index(PersonIndexRequest $request): AnonymousResourceCollection|JsonResponse
    {
        if (! $request->wantsListView()) {
            return PersonListResource::collection($this->directory($request));
        }

        $query = Person::query()
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

        $people = $query
            ->with(self::LIST_RELATIONS)
            ->sortedBy($request->sortKey(), $request->sortDirection())
            ->paginate($request->perPage());

        return PersonListResource::collection($people);
    }

    /**
     * The whole directory, optionally narrowed by the legacy `role`,
     * `animal_type_id` and `organization_id` parameters.
     *
     * @return Collection<int, Person>
     */
    private function directory(Request $request): Collection
    {
        $query = Person::with(self::LIST_RELATIONS);

        if ($request->filled('organization_id')) {
            $query->where('organization_id', $request->input('organization_id'));
        }

        $role = $request->input('role');
        $animalTypeId = $request->input('animal_type_id');

        if ($role) {
            match ($role) {
                'inspector' => $query->whereHas('inspectorAnimalTypes', function ($q) use ($animalTypeId) {
                    if ($animalTypeId) {
                        $q->where('animal_types.id', $animalTypeId);
                    }
                }),
                'mediator' => $query->whereHas('mediatorAnimalTypes', function ($q) use ($animalTypeId) {
                    if ($animalTypeId) {
                        $q->where('animal_types.id', $animalTypeId);
                    }
                }),
                'foster' => $query->whereHas('fosterAnimalTypes', function ($q) use ($animalTypeId) {
                    if ($animalTypeId) {
                        $q->where('animal_types.id', $animalTypeId);
                    }
                }),
                'adopter' => $query->whereHas('adoptionsAsApplicant'),
                default => null,
            };
        } elseif ($animalTypeId) {
            $query->where(function ($q) use ($animalTypeId) {
                $q->whereHas('inspectorAnimalTypes', fn ($r) => $r->where('animal_types.id', $animalTypeId))
                    ->orWhereHas('mediatorAnimalTypes', fn ($r) => $r->where('animal_types.id', $animalTypeId))
                    ->orWhereHas('fosterAnimalTypes', fn ($r) => $r->where('animal_types.id', $animalTypeId));
            });
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * Store a newly created person in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'organization_id' => 'nullable|uuid|exists:organizations,id',
            'organization_role' => 'string|max:255',
            'email' => 'email|max:255',
            'street_line' => 'string|max:255',
            'street_line_additional' => 'string|max:255',
            'postal_code' => 'string|max:255',
            'city' => 'string|max:255',
            'country_code' => 'string|size:2',
            'phone' => 'string|max:255',
            'mobile' => 'string|max:255',
            'date_of_birth' => 'nullable|date',
        ]);

        $person = Person::create($validated);
        $person->load(['organization', 'inspectorAnimalTypes', 'mediatorAnimalTypes', 'fosterAnimalTypes', 'media']);

        return response()->json([
            'message' => 'Person erfolgreich angelegt.',
            'data' => new PersonDetailResource($person),
        ], 201);
    }

    /**
     * Display the specified person.
     */
    public function show(Person $person): PersonDetailResource
    {
        $person->load(['organization:id,name', 'inspectorAnimalTypes', 'mediatorAnimalTypes', 'fosterAnimalTypes', 'media']);

        return new PersonDetailResource($person);
    }

    /**
     * Update the specified person in storage.
     */
    public function update(Request $request, Person $person): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'organization_id' => 'sometimes|nullable|uuid|exists:organizations,id',
            'organization_role' => 'sometimes|nullable|string|max:255',
            'email' => 'sometimes|nullable|email|max:255',
            'street_line' => 'string|max:255',
            'street_line_additional' => 'string|max:255',
            'postal_code' => 'string|max:255',
            'city' => 'string|max:255',
            'country_code' => 'string|size:2',
            'phone' => 'sometimes|nullable|string|max:255',
            'mobile' => 'sometimes|nullable|string|max:255',
            'date_of_birth' => 'sometimes|nullable|date',
            'inspector_animal_type_ids' => 'sometimes|array',
            'inspector_animal_type_ids.*' => 'uuid|exists:animal_types,id',
            'mediator_animal_type_ids' => 'sometimes|array',
            'mediator_animal_type_ids.*' => 'uuid|exists:animal_types,id',
            'foster_animal_type_ids' => 'sometimes|array',
            'foster_animal_type_ids.*' => 'uuid|exists:animal_types,id',
        ]);

        $person->update($validated);

        // Sync inspector animal types if provided
        if ($request->has('inspector_animal_type_ids')) {
            $person->inspectorAnimalTypes()->sync($validated['inspector_animal_type_ids'] ?? []);
        }

        // Sync mediator animal types if provided
        if ($request->has('mediator_animal_type_ids')) {
            $person->mediatorAnimalTypes()->sync($validated['mediator_animal_type_ids'] ?? []);
        }

        // Sync foster animal types if provided
        if ($request->has('foster_animal_type_ids')) {
            $person->fosterAnimalTypes()->sync($validated['foster_animal_type_ids'] ?? []);
        }

        $person->load(['organization', 'inspectorAnimalTypes', 'mediatorAnimalTypes', 'fosterAnimalTypes', 'media']);

        return response()->json([
            'message' => 'Person erfolgreich aktualisiert.',
            'data' => new PersonDetailResource($person),
        ]);
    }

    /**
     * Remove the specified person from storage.
     */
    public function destroy(Person $person): JsonResponse
    {
        $person->delete();

        return response()->json([
            'message' => 'Person erfolgreich gelöscht.',
        ]);
    }
}
