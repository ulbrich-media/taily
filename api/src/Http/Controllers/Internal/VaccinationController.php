<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Taily\Http\Controllers\Controller;
use Taily\Http\Requests\AnimalTypeItemIndexRequest;
use Taily\Http\Resources\VaccinationResource;
use Taily\Models\Vaccination;

class VaccinationController extends Controller
{
    public function __construct()
    {
        $this->middleware('admin')->only(['store', 'update', 'destroy']);
    }

    /**
     * One merged list of all vaccinations, grouped by animal type (see
     * AnimalTypeItemIndexRequest). `per_page=0` only counts. Without any list
     * parameter all vaccinations are returned, optionally narrowed by the
     * legacy `animal_type_id` parameter.
     */
    public function index(AnimalTypeItemIndexRequest $request): AnonymousResourceCollection|JsonResponse
    {
        if (! $request->wantsListView()) {
            $validated = $request->validate([
                'animal_type_id' => 'sometimes|uuid|exists:animal_types,id',
            ]);

            $query = Vaccination::with('animalType')->orderBy('title');

            if (isset($validated['animal_type_id'])) {
                $query->where('animal_type_id', $validated['animal_type_id']);
            }

            return response()->json(VaccinationResource::collection($query->get()));
        }

        $query = Vaccination::query()->filterBy($request->filters());

        if ($request->perPage() === 0) {
            return $request->countResponse($query);
        }

        return VaccinationResource::collection(
            $query->with('animalType')
                ->orderedByAnimalType()
                ->paginate($request->perPage())
        );
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
