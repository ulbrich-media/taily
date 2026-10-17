<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Taily\Http\Controllers\Controller;
use Taily\Http\Requests\CatalogIndexRequest;
use Taily\Http\Resources\AnimalTypeResource;
use Taily\Models\AnimalType;
use Taily\Services\AnimalTraitService;

class AnimalTypeController extends Controller
{
    public function __construct()
    {
        $this->middleware('admin')->only(['store', 'update', 'destroy']);
    }

    /**
     * Display a page of animal types, ordered by title (see
     * CatalogIndexRequest). `per_page=0` only counts. Without any list
     * parameter all animal types are returned, which the pickers in other
     * forms still rely on.
     */
    public function index(CatalogIndexRequest $request): AnonymousResourceCollection|JsonResponse
    {
        if (! $request->wantsListView()) {
            $animalTypes = AnimalType::with('preInspectionFormTemplate')->get();

            return response()->json([
                'data' => AnimalTypeResource::collection($animalTypes),
                'count' => $animalTypes->count(),
            ]);
        }

        if ($request->perPage() === 0) {
            return $request->countResponse(AnimalType::query());
        }

        return AnimalTypeResource::collection(
            AnimalType::with('preInspectionFormTemplate')
                ->orderBy('title')
                ->orderBy('id')
                ->paginate($request->perPage())
        );
    }

    /**
     * Store a newly created animal type.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255|unique:animal_types,title',
            'pre_inspection_form_template_id' => 'nullable|uuid|exists:form_templates,id',
        ]);

        $animalType = AnimalType::create($validated);
        $animalType->load('preInspectionFormTemplate');

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
        $animalType->load('preInspectionFormTemplate');

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
            'pre_inspection_form_template_id' => 'nullable|uuid|exists:form_templates,id',
        ]);

        $animalType->update($validated);
        $animalType->load('preInspectionFormTemplate');

        return response()->json([
            'message' => 'Tierart erfolgreich aktualisiert.',
            'data' => new AnimalTypeResource($animalType),
        ]);
    }

    /**
     * Return distinct trait suggestion values for all animals of this type.
     */
    public function traitSuggestions(AnimalType $animalType): JsonResponse
    {
        return response()->json([
            'compatibilities' => AnimalTraitService::suggestions($animalType->id, 'compatibility'),
            'personality_traits' => AnimalTraitService::suggestions($animalType->id, 'personality_trait'),
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
