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
                $preInspection->load('formSubmission.formTemplateVersion');
                $submission = $preInspection->formSubmission;
                $version = $submission?->formTemplateVersion;

                if ($version) {
                    $result = $this->formTemplateService->validateSubmissionData(
                        $version,
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

        $preInspection->load($this->detailRelations());

        return response()->json([
            'message' => 'Vorkontrolle erfolgreich aktualisiert.',
            'data' => new PreInspectionDetailResource($preInspection),
        ]);
    }

    /**
     * First submission from the admin interface (equivalent to the public token submit).
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
            $preInspection->load('animalType.preInspectionFormTemplate.latestVersion');
            $latestVersion = $preInspection->animalType?->preInspectionFormTemplate?->latestVersion;

            if ($latestVersion && ! empty($validated['form_data'])) {
                $validation = $this->formTemplateService->validateSubmissionData(
                    $latestVersion,
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

            if ($latestVersion) {
                $preInspection->formSubmission()->create([
                    'form_template_version_id' => $latestVersion->id,
                    'data' => $validated['form_data'] ?? [],
                ]);
            }

            $preInspection->verdict = $validated['verdict'];
            $preInspection->notes = $validated['notes'] ?? '';
            $preInspection->submitted_at = now();
            $preInspection->save();

            $preInspection->load($this->detailRelations());

            return $preInspection;
        });

        return response()->json([
            'message' => 'Vorkontrolle erfolgreich eingereicht.',
            'data' => new PreInspectionDetailResource($result),
        ]);
    }

    public function destroy(PreInspection $preInspection): JsonResponse
    {
        $preInspection->delete();

        return response()->json(['message' => 'Vorkontrolle erfolgreich gelöscht.']);
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
