<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Taily\Http\Controllers\Controller;
use Taily\Models\Adoption;
use Taily\Support\CaseFile\CaseFileService;

/**
 * The applicant's other adoptions — same email or same referenced Person —
 * and taking over their data (ADR-018).
 */
class AdoptionRelatedController extends Controller
{
    public function index(Adoption $adoption): JsonResponse
    {
        $related = Adoption::relatedTo($adoption)
            ->with(['animal.animalType'])
            ->latest()
            ->get();

        return response()->json($related->map(fn (Adoption $other) => [
            'id' => $other->id,
            'status' => $other->status,
            'created_at' => $other->created_at,
            'applicant' => [
                'full_name' => $other->applicant_full_name,
                'email' => $other->applicant_email,
            ],
            'animal' => $other->animal ? [
                'id' => $other->animal->id,
                'name' => $other->animal->name,
                'animal_type' => $other->animal->animalType?->title,
            ] : null,
            // Why it counts as the same applicant.
            'matched_by' => array_values(array_filter([
                $adoption->applicant_email !== '' && $other->applicant_email === $adoption->applicant_email && $other->status !== 'unconfirmed' && $adoption->status !== 'unconfirmed' ? 'email' : null,
                $adoption->applicant_person_id !== null && $other->applicant_person_id === $adoption->applicant_person_id ? 'person' : null,
            ])),
            'pre_inspection_status' => $other->pre_inspection_status,
            'contract_signed' => $other->contract_signed,
            'handed_over_at' => $other->handed_over_at,
        ]));
    }

    public function import(Request $request, Adoption $adoption, CaseFileService $caseFile): JsonResponse
    {
        $validated = $request->validate(['from_adoption_id' => ['required', 'uuid']]);

        $source = Adoption::relatedTo($adoption)->find($validated['from_adoption_id']);

        if ($source === null) {
            throw ValidationException::withMessages([
                'from_adoption_id' => ['Diese Vermittlung gehört nicht zur selben Bewerber:in.'],
            ]);
        }

        $filled = $caseFile->importFrom($adoption, $source);

        return response()->json([
            'message' => $filled === []
                ? 'Keine Angaben übernommen – alles, was die andere Vermittlung hat, ist hier schon ausgefüllt.'
                : count($filled).' Angaben übernommen: '.implode(', ', $filled).'.',
            'filled' => $filled,
            'data' => $caseFile->present($adoption),
        ]);
    }
}
