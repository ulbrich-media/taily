<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Taily\Http\Controllers\Controller;
use Taily\Http\Resources\PreInspectionDetailResource;
use Taily\Http\Resources\PreInspectionListResource;
use Taily\Models\FormTemplate;
use Taily\Models\Person;
use Taily\Models\PreInspection;
use Taily\Support\FormTemplateService;

class PreInspectionController extends Controller
{
    public function __construct(
        private FormTemplateService $formTemplateService
    ) {}

    /**
     * Display a listing of pre-inspections.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = PreInspection::with(['person', 'animalType', 'inspector', 'accessTokens'])
            ->orderBy('created_at', 'desc');

        $filters = $request->validate([
            'person_id' => 'sometimes|uuid',
            'animal_type_id' => 'sometimes|uuid',
        ]);

        if (isset($filters['person_id'])) {
            $query->where('person_id', $filters['person_id']);
        }

        if (isset($filters['animal_type_id'])) {
            $query->where('animal_type_id', $filters['animal_type_id']);
        }

        return PreInspectionListResource::collection($query->get());
    }

    /**
     * Store a newly created pre-inspection.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'person_id' => 'required|uuid|exists:people,id',
            'animal_type_id' => 'required|uuid|exists:animal_types,id',
            'inspector_id' => 'nullable|uuid|exists:people,id',
        ]);

        if (! empty($validated['inspector_id'])) {
            $this->assertInspectorEligible($validated['inspector_id'], $validated['animal_type_id']);
        }

        $inspection = new PreInspection;
        $inspection->person_id = $validated['person_id'];
        $inspection->animal_type_id = $validated['animal_type_id'];
        $inspection->inspector_id = $validated['inspector_id'] ?? null;
        $inspection->notes = '';
        $inspection->save();
        $inspection->issueToken(now()->addDays(30));

        $inspection->load(['person', 'animalType.preInspectionFormTemplate', 'inspector', 'accessTokens', 'formSubmission.formTemplate']);

        return response()->json([
            'message' => 'Vorkontrolle erfolgreich angelegt.',
            'data' => new PreInspectionDetailResource($inspection),
        ], 201);
    }

    /**
     * Display the specified pre-inspection.
     */
    public function show(PreInspection $preInspection): PreInspectionDetailResource
    {
        $preInspection->load(['person', 'animalType.preInspectionFormTemplate', 'inspector', 'accessTokens', 'formSubmission.formTemplate']);

        return new PreInspectionDetailResource($preInspection);
    }

    /**
     * Update the specified pre-inspection.
     *
     * Pre-submission: only inspector_id is accepted.
     * Post-submission: verdict, notes, form_data, and inspector_id are accepted.
     */
    public function update(Request $request, PreInspection $preInspection): JsonResponse
    {
        if ($preInspection->isSubmitted()) {
            $validated = $request->validate([
                'inspector_id' => 'sometimes|nullable|uuid|exists:people,id',
                'verdict' => 'sometimes|in:approved,rejected',
                'notes' => 'sometimes|string',
                'form_data' => 'sometimes|array',
            ]);

            if (array_key_exists('inspector_id', $validated) && $validated['inspector_id'] !== null) {
                $this->assertInspectorEligible($validated['inspector_id'], $preInspection->animal_type_id);
            }

            if (array_key_exists('form_data', $validated)) {
                $preInspection->load('formSubmission.formTemplate');
                $submission = $preInspection->formSubmission;

                if ($submission?->formTemplate) {
                    $result = $this->formTemplateService->validateSubmissionData(
                        $submission->formTemplate,
                        $validated['form_data']
                    );

                    if (! $result['valid']) {
                        throw ValidationException::withMessages(
                            collect($result['errors'])
                                ->mapWithKeys(fn ($msgs, $key) => ["form_data.{$key}" => $msgs])
                                ->toArray()
                        );
                    }

                    $submission->update(['data' => $validated['form_data']]);
                }
            }

            $preInspection->inspector_id = array_key_exists('inspector_id', $validated)
                ? $validated['inspector_id']
                : $preInspection->inspector_id;
            $preInspection->verdict = array_key_exists('verdict', $validated)
                ? $validated['verdict']
                : $preInspection->verdict;
            $preInspection->notes = array_key_exists('notes', $validated)
                ? $validated['notes']
                : $preInspection->notes;
            $preInspection->save();
        } else {
            $validated = $request->validate([
                'inspector_id' => 'sometimes|nullable|uuid|exists:people,id',
            ]);

            if (array_key_exists('inspector_id', $validated) && $validated['inspector_id'] !== null) {
                $this->assertInspectorEligible($validated['inspector_id'], $preInspection->animal_type_id);
            }

            $preInspection->inspector_id = array_key_exists('inspector_id', $validated)
                ? $validated['inspector_id']
                : $preInspection->inspector_id;
            $preInspection->save();
        }

        $preInspection->load(['person', 'animalType.preInspectionFormTemplate', 'inspector', 'accessTokens', 'formSubmission.formTemplate']);

        return response()->json([
            'message' => 'Vorkontrolle erfolgreich aktualisiert.',
            'data' => new PreInspectionDetailResource($preInspection),
        ]);
    }

    /**
     * Submit a pre-inspection from the admin interface.
     *
     * Equivalent to the public token submit but authenticated.
     * Returns 422 if already submitted.
     */
    public function submit(Request $request, PreInspection $preInspection): JsonResponse
    {
        if ($preInspection->isSubmitted()) {
            return response()->json(['message' => 'Diese Vorkontrolle wurde bereits eingereicht.'], 422);
        }

        $validated = $request->validate([
            'verdict' => 'required|in:approved,rejected',
            'notes' => 'nullable|string',
            'form_data' => 'nullable|array',
        ]);

        $result = DB::transaction(function () use ($preInspection, $validated) {
            $preInspection->load('animalType');
            $templateId = $preInspection->animalType?->pre_inspection_form_template_id;

            if ($templateId) {
                $template = FormTemplate::find($templateId);

                if ($template && ! empty($validated['form_data'])) {
                    $validation = $this->formTemplateService->validateSubmissionData(
                        $template,
                        $validated['form_data']
                    );

                    if (! $validation['valid']) {
                        throw ValidationException::withMessages(
                            collect($validation['errors'])
                                ->mapWithKeys(fn ($msgs, $key) => ["form_data.{$key}" => $msgs])
                                ->toArray()
                        );
                    }
                }

                $preInspection->formSubmission()->create([
                    'form_template_id' => $templateId,
                    'data' => $validated['form_data'] ?? [],
                ]);
            }

            $preInspection->verdict = $validated['verdict'];
            $preInspection->notes = $validated['notes'] ?? '';
            $preInspection->submitted_at = now();
            $preInspection->save();

            $preInspection->load(['person', 'animalType.preInspectionFormTemplate', 'inspector', 'accessTokens', 'formSubmission.formTemplate']);

            return $preInspection;
        });

        return response()->json([
            'message' => 'Vorkontrolle erfolgreich eingereicht.',
            'data' => new PreInspectionDetailResource($result),
        ]);
    }

    /**
     * Remove the specified pre-inspection.
     */
    public function destroy(PreInspection $preInspection): JsonResponse
    {
        $preInspection->delete();

        return response()->json([
            'message' => 'Vorkontrolle erfolgreich gelöscht.',
        ]);
    }

    private function assertInspectorEligible(string $inspectorId, string $animalTypeId): void
    {
        $eligible = Person::whereKey($inspectorId)
            ->whereHas('inspectorAnimalTypes', fn ($q) => $q->where('animal_types.id', $animalTypeId))
            ->exists();

        if (! $eligible) {
            throw ValidationException::withMessages([
                'inspector_id' => 'Die gewählte Person ist für diese Tierart nicht als Kontrolleur hinterlegt.',
            ]);
        }
    }
}
