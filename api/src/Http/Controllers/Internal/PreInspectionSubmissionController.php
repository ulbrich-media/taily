<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Taily\Http\Controllers\Controller;
use Taily\Models\PreInspection;
use Taily\Support\CaseFile\CaseFileService;

/**
 * The inspector's public page (token access). The inspector checks what the
 * applicant sent in — only the Case File fields marked visible to inspectors
 * — and records a verdict and a memo (docs/features/pre-inspection.md).
 */
class PreInspectionSubmissionController extends Controller
{
    private const NOT_FOUND = 'Diese Vorkontrolle wurde nicht gefunden, ist abgelaufen, wurde bereits eingereicht oder die Vermittlung ist abgeschlossen.';

    public function show(string $token, CaseFileService $caseFile): JsonResponse
    {
        $inspection = PreInspection::findByToken($token);

        if (! $inspection) {
            return response()->json(['message' => self::NOT_FOUND], 404);
        }

        $inspection->load(['adoption.animal.animalType']);
        $adoption = $inspection->adoption;

        $groups = collect($caseFile->present($adoption)['groups'])
            ->map(fn (array $group) => [
                'id' => $group['id'],
                'title' => $group['title'],
                'fields' => collect($group['fields'])
                    ->filter(fn (array $field) => $field['visible_to_inspector'] && $field['applies'])
                    ->map(fn (array $field) => [
                        'key' => $field['key'],
                        'label' => $field['label'],
                        'type' => $field['type'],
                        'options' => $field['options'],
                        'value' => $field['value'],
                    ])
                    ->values(),
            ])
            ->filter(fn (array $group) => $group['fields']->isNotEmpty())
            ->values();

        return response()->json([
            'id' => $inspection->id,
            'verdict' => $inspection->verdict,
            'memo' => $inspection->memo,
            'animal' => [
                'name' => $adoption->animal?->name,
                'animal_type' => $adoption->animal?->animalType?->title,
                'breed' => $adoption->animal?->breed,
            ],
            'person' => [
                'full_name' => $adoption->applicant_full_name,
                'street_line' => $adoption->applicant_street_line,
                'street_line_additional' => $adoption->applicant_street_line_additional,
                'postal_code' => $adoption->applicant_postal_code,
                'city' => $adoption->applicant_city,
                'country_code' => $adoption->applicant_country_code,
            ],
            'case_file' => $groups,
        ]);
    }

    public function submit(Request $request, string $token): JsonResponse
    {
        $validated = $request->validate([
            'verdict' => 'required|in:approved,rejected',
            'memo' => 'nullable|string|max:10000',
        ]);

        $submitted = DB::transaction(function () use ($token, $validated) {
            $inspection = PreInspection::openByToken($token)
                ->lockForUpdate()
                ->first();

            if (! $inspection) {
                return false;
            }

            $inspection->verdict = $validated['verdict'];
            $inspection->memo = $validated['memo'] ?? '';
            $inspection->submitted_at = now();
            $inspection->save();

            return true;
        });

        if (! $submitted) {
            return response()->json(['message' => self::NOT_FOUND], 404);
        }

        return response()->json(['message' => 'Vorkontrolle erfolgreich eingereicht.']);
    }
}
