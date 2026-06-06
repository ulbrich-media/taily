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
use Taily\Models\Person;
use Taily\Models\PreInspection;
use Taily\Support\FormTemplateService;

class PreInspectionController extends Controller
{
    public function __construct(
        private FormTemplateService $formTemplateService
    ) {}

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

        $inspection->load($this->detailRelations());

        return response()->json([
            'message' => 'Vorkontrolle erfolgreich angelegt.',
            'data' => new PreInspectionDetailResource($inspection),
        ], 201);
    }

    public function show(PreInspection $preInspection): PreInspectionDetailResource
    {
        $preInspection->load($this->detailRelations());

        return new PreInspectionDetailResource($preInspection);
    }

    /**
     * Update the assigned inspector.
     */
    public function updateInspector(Request $request, PreInspection $preInspection): JsonResponse
    {
        $validated = $request->validate([
            'inspector_id' => 'nullable|uuid|exists:people,id',
        ]);

        if ($validated['inspector_id'] !== null) {
            $this->assertInspectorEligible($validated['inspector_id'], $preInspection->animal_type_id);
        }

        $preInspection->inspector_id = $validated['inspector_id'];
        $preInspection->save();

        $preInspection->load($this->detailRelations());

        return response()->json([
            'message' => 'Kontrolleur erfolgreich aktualisiert.',
            'data'    => new PreInspectionDetailResource($preInspection),
        ]);
    }

    /**
     * Pre-submission: first submission only (verdict + notes + form_data).
     * When a form template is assigned via the animal type, form_data is
     * required and validated against the schema.
     * Post-submission: verdict, notes, and form_data can be edited freely.
     */
    public function update(Request $request, PreInspection $preInspection): JsonResponse
    {
        $validated = $request->validate([
            'verdict'   => 'sometimes|in:approved,rejected',
            'notes'     => 'sometimes|nullable|string',
            'form_data' => 'sometimes|nullable|array',
        ]);

        if (! $preInspection->isSubmitted()) {
            // First submission: verdict is required
            if (! array_key_exists('verdict', $validated)) {
                throw ValidationException::withMessages([
                    'verdict' => ['Das Urteil ist erforderlich.'],
                ]);
            }

            $preInspection->load('animalType.preInspectionFormTemplate.latestVersion');
            $latestVersion = $preInspection->animalType?->preInspectionFormTemplate?->latestVersion;

            // form_data is required when the animal type has a form template
            if ($latestVersion && ! array_key_exists('form_data', $validated)) {
                throw ValidationException::withMessages([
                    'form_data' => ['Formulardaten sind für diesen Tiertyp erforderlich.'],
                ]);
            }

            if ($latestVersion) {
                $this->validateFormData($latestVersion, $validated['form_data'] ?? []);
            }

            DB::transaction(function () use ($preInspection, $validated, $latestVersion) {
                if ($latestVersion) {
                    $preInspection->formSubmission()->create([
                        'form_template_version_id' => $latestVersion->id,
                        'data'                     => $validated['form_data'] ?? [],
                    ]);
                }

                $preInspection->verdict      = $validated['verdict'];
                $preInspection->notes        = $validated['notes'] ?? '';
                $preInspection->submitted_at = now();
                $preInspection->save();
            });

            $preInspection->load($this->detailRelations());

            return response()->json([
                'message' => 'Vorkontrolle erfolgreich eingereicht.',
                'data'    => new PreInspectionDetailResource($preInspection),
            ]);
        }

        // Post-submission: free editing
        if (array_key_exists('form_data', $validated)) {
            $preInspection->load('formSubmission.formTemplateVersion');
            $submission = $preInspection->formSubmission;
            $version    = $submission?->formTemplateVersion;

            if ($version && $validated['form_data'] !== null) {
                $this->validateFormData($version, $validated['form_data']);
                $submission->update(['data' => $validated['form_data']]);
            }
        }

        if (array_key_exists('verdict', $validated)) {
            $preInspection->verdict = $validated['verdict'];
        }
        if (array_key_exists('notes', $validated)) {
            $preInspection->notes = $validated['notes'];
        }
        $preInspection->save();

        $preInspection->load($this->detailRelations());

        return response()->json([
            'message' => 'Vorkontrolle erfolgreich aktualisiert.',
            'data'    => new PreInspectionDetailResource($preInspection),
        ]);
    }

    public function destroy(PreInspection $preInspection): JsonResponse
    {
        $preInspection->delete();

        return response()->json(['message' => 'Vorkontrolle erfolgreich gelöscht.']);
    }

    private function validateFormData(\Taily\Models\FormTemplateVersion $version, array $data): void
    {
        $result = $this->formTemplateService->validateSubmissionData($version, $data);

        if (! $result['valid']) {
            throw ValidationException::withMessages(
                collect($result['errors'])
                    ->mapWithKeys(fn ($msgs, $key) => ["form_data.{$key}" => $msgs])
                    ->toArray()
            );
        }
    }

    private function detailRelations(): array
    {
        return [
            'person',
            'animalType.preInspectionFormTemplate.latestVersion',
            'inspector',
            'accessTokens',
            'formSubmission.formTemplateVersion',
        ];
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
