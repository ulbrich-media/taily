<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;
use Taily\Http\Controllers\Controller;
use Taily\Http\Resources\PreInspectionDetailResource;
use Taily\Http\Resources\PreInspectionListResource;
use Taily\Models\Adoption;
use Taily\Models\Person;
use Taily\Models\PreInspection;

/**
 * Pre-inspections belong to an adoption (docs/features/pre-inspection.md).
 * Listing by person gives the cross-reference of earlier pre-inspections a
 * repeat applicant went through for other animals.
 */
class PreInspectionController extends Controller
{
    private const RELATIONS = ['inspector', 'accessTokens', 'adoption.animal.animalType', 'adoption.applicant'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'adoption_id' => 'sometimes|uuid',
            'person_id' => 'sometimes|uuid',
        ]);

        $query = PreInspection::with(self::RELATIONS)->orderBy('created_at', 'desc');

        if (isset($filters['adoption_id'])) {
            $query->where('adoption_id', $filters['adoption_id']);
        }

        if (isset($filters['person_id'])) {
            $query->whereHas('adoption', fn (Builder $adoption) => $adoption->where('applicant_id', $filters['person_id']));
        }

        return PreInspectionListResource::collection($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'adoption_id' => 'required|uuid|exists:adoptions,id',
            'inspector_id' => 'nullable|uuid|exists:people,id',
        ]);

        $adoption = Adoption::with('animal')->findOrFail($validated['adoption_id']);

        if (! empty($validated['inspector_id'])) {
            $this->assertInspectorEligible($validated['inspector_id'], $adoption);
        }

        $inspection = new PreInspection(['adoption_id' => $adoption->id]);
        $inspection->inspector_id = $validated['inspector_id'] ?? null;
        $inspection->save();
        $inspection->issueToken(now()->addDays(30));

        $inspection->load(self::RELATIONS);

        return response()->json([
            'message' => 'Vorkontrolle erfolgreich angelegt.',
            'data' => new PreInspectionDetailResource($inspection),
        ], 201);
    }

    public function show(PreInspection $preInspection): PreInspectionDetailResource
    {
        $preInspection->load(self::RELATIONS);

        return new PreInspectionDetailResource($preInspection);
    }

    public function updateInspector(Request $request, PreInspection $preInspection): JsonResponse
    {
        $validated = $request->validate([
            'inspector_id' => 'nullable|uuid|exists:people,id',
        ]);

        if ($validated['inspector_id'] !== null) {
            $this->assertInspectorEligible($validated['inspector_id'], $preInspection->adoption()->with('animal')->firstOrFail());
        }

        $preInspection->inspector_id = $validated['inspector_id'];
        $preInspection->save();

        $preInspection->load(self::RELATIONS);

        return response()->json([
            'message' => 'Kontrolleur erfolgreich aktualisiert.',
            'data' => new PreInspectionDetailResource($preInspection),
        ]);
    }

    /**
     * The mediator can record or correct verdict and memo at any time.
     * Recording a verdict for the first time submits the pre-inspection,
     * which also invalidates the inspector's link.
     */
    public function update(Request $request, PreInspection $preInspection): JsonResponse
    {
        $validated = $request->validate([
            'verdict' => 'sometimes|nullable|in:approved,rejected',
            'memo' => 'sometimes|nullable|string|max:10000',
        ]);

        if (array_key_exists('verdict', $validated)) {
            if ($validated['verdict'] === null && $preInspection->isSubmitted()) {
                throw ValidationException::withMessages([
                    'verdict' => ['Eine eingereichte Vorkontrolle braucht ein Ergebnis.'],
                ]);
            }

            $preInspection->verdict = $validated['verdict'];

            if ($validated['verdict'] !== null && ! $preInspection->isSubmitted()) {
                $preInspection->submitted_at = now();
            }
        }

        if (array_key_exists('memo', $validated)) {
            $preInspection->memo = $validated['memo'] ?? '';
        }

        $preInspection->save();
        $preInspection->load(self::RELATIONS);

        return response()->json([
            'message' => 'Vorkontrolle erfolgreich aktualisiert.',
            'data' => new PreInspectionDetailResource($preInspection),
        ]);
    }

    public function destroy(PreInspection $preInspection): JsonResponse
    {
        $preInspection->delete();

        return response()->json(['message' => 'Vorkontrolle erfolgreich gelöscht.']);
    }

    private function assertInspectorEligible(string $inspectorId, Adoption $adoption): void
    {
        $eligible = Person::whereKey($inspectorId)
            ->whereHas('inspectorAnimalTypes', fn ($q) => $q->where('animal_types.id', $adoption->animal?->animal_type_id))
            ->exists();

        if (! $eligible) {
            throw ValidationException::withMessages([
                'inspector_id' => 'Die gewählte Person ist für diese Tierart nicht als Kontrolleur hinterlegt.',
            ]);
        }

        if ($inspectorId === $adoption->applicant_id) {
            throw ValidationException::withMessages([
                'inspector_id' => 'Bewerber:innen können ihre eigene Vorkontrolle nicht durchführen.',
            ]);
        }
    }
}
