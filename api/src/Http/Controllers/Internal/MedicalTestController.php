<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Taily\Http\Controllers\Controller;
use Taily\Http\Requests\AnimalTypeItemIndexRequest;
use Taily\Http\Resources\MedicalTestResource;
use Taily\Models\MedicalTest;

class MedicalTestController extends Controller
{
    public function __construct()
    {
        $this->middleware('admin')->only(['store', 'update', 'destroy']);
    }

    /**
     * One merged list of all medical tests, grouped by animal type (see
     * AnimalTypeItemIndexRequest). `per_page=0` only counts. Without any list
     * parameter all tests are returned, optionally narrowed by the legacy
     * `animal_type_id` parameter.
     */
    public function index(AnimalTypeItemIndexRequest $request): AnonymousResourceCollection|JsonResponse
    {
        if (! $request->wantsListView()) {
            $validated = $request->validate([
                'animal_type_id' => 'sometimes|uuid|exists:animal_types,id',
            ]);

            $query = MedicalTest::with('animalType')->orderBy('title');

            if (isset($validated['animal_type_id'])) {
                $query->where('animal_type_id', $validated['animal_type_id']);
            }

            return response()->json(MedicalTestResource::collection($query->get()));
        }

        $query = MedicalTest::query()->filterBy($request->filters());

        if ($request->perPage() === 0) {
            return $request->countResponse($query);
        }

        return MedicalTestResource::collection(
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

        $medicalTest = MedicalTest::create($validated);
        $medicalTest->load('animalType');

        return response()->json([
            'message' => 'Test erfolgreich angelegt.',
            'data' => new MedicalTestResource($medicalTest),
        ], 201);
    }

    public function show(MedicalTest $medicalTest): JsonResponse
    {
        $medicalTest->load('animalType');

        return response()->json(new MedicalTestResource($medicalTest));
    }

    public function update(Request $request, MedicalTest $medicalTest): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'sometimes|string|max:255',
        ]);

        $medicalTest->update($validated);
        $medicalTest->load('animalType');

        return response()->json([
            'message' => 'Test erfolgreich aktualisiert.',
            'data' => new MedicalTestResource($medicalTest),
        ]);
    }

    public function destroy(MedicalTest $medicalTest): JsonResponse
    {
        $medicalTest->delete();

        return response()->json([
            'message' => 'Test erfolgreich gelöscht.',
        ]);
    }
}
