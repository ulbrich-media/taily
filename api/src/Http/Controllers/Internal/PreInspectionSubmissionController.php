<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Taily\Http\Controllers\Controller;
use Taily\Models\FormTemplate;
use Taily\Models\PreInspection;
use Taily\Support\FormTemplateService;

class PreInspectionSubmissionController extends Controller
{
    public function __construct(
        private FormTemplateService $formTemplateService
    ) {}

    /**
     * Display the pre-inspection data for public token access.
     */
    public function show(string $token): JsonResponse
    {
        $inspection = PreInspection::findByToken($token);

        if (! $inspection) {
            return response()->json([
                'message' => 'Diese Vorkontrolle wurde nicht gefunden, ist abgelaufen oder wurde bereits eingereicht.',
            ], 404);
        }

        $inspection->load(['person', 'animalType.preInspectionFormTemplate']);

        if (! $inspection->person) {
            return response()->json(['message' => 'Interessent nicht gefunden.'], 422);
        }

        if (! $inspection->animalType) {
            return response()->json(['message' => 'Tierart nicht gefunden.'], 422);
        }

        $template = $inspection->animalType->preInspectionFormTemplate;

        return response()->json([
            'id' => $inspection->id,
            'verdict' => $inspection->verdict,
            'notes' => $inspection->notes,
            'person' => [
                'id' => $inspection->person->id,
                'full_name' => $inspection->person->full_name,
                'first_name' => $inspection->person->first_name,
                'last_name' => $inspection->person->last_name,
                'street_line' => $inspection->person->street_line,
                'street_line_additional' => $inspection->person->street_line_additional,
                'postal_code' => $inspection->person->postal_code,
                'city' => $inspection->person->city,
                'country_code' => $inspection->person->country_code,
            ],
            'animal_type' => [
                'id' => $inspection->animalType->id,
                'title' => $inspection->animalType->title,
            ],
            'pre_inspection_form_template' => $template ? [
                'id' => $template->id,
                'schema' => $template->schema,
                'ui_schema' => $template->ui_schema,
            ] : null,
        ]);
    }

    /**
     * Submit inspection data via public token.
     */
    public function submit(Request $request, string $token): JsonResponse
    {
        $validated = $request->validate([
            'verdict' => 'required|in:approved,rejected',
            'notes' => 'nullable|string',
            'form_data' => 'nullable|array',
        ]);

        $submitted = DB::transaction(function () use ($token, $validated) {
            $inspection = PreInspection::whereHasValidToken($token)
                ->whereNull('submitted_at')
                ->lockForUpdate()
                ->first();

            if (! $inspection) {
                return false;
            }

            $inspection->load('animalType');
            $templateId = $inspection->animalType?->pre_inspection_form_template_id;

            if ($templateId) {
                $template = FormTemplate::find($templateId);

                if ($template && ! empty($validated['form_data'])) {
                    $result = $this->formTemplateService->validateSubmissionData(
                        $template,
                        $validated['form_data']
                    );

                    if (! $result['valid']) {
                        throw ValidationException::withMessages(
                            collect($result['errors'])
                                ->mapWithKeys(fn ($msgs, $key) => ["form_data.{$key}" => $msgs])
                                ->toArray()
                        );
                    }
                }

                $inspection->formSubmission()->create([
                    'form_template_id' => $templateId,
                    'data' => $validated['form_data'] ?? [],
                ]);
            }

            $inspection->verdict = $validated['verdict'];
            $inspection->notes = $validated['notes'] ?? '';
            $inspection->submitted_at = now();
            $inspection->save();

            return true;
        });

        if (! $submitted) {
            return response()->json([
                'message' => 'Diese Vorkontrolle wurde nicht gefunden, ist abgelaufen oder wurde bereits eingereicht.',
            ], 404);
        }

        return response()->json([
            'message' => 'Vorkontrolle erfolgreich eingereicht.',
        ]);
    }
}
