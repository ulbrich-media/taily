<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Taily\Http\Controllers\Controller;
use Taily\Http\Requests\CatalogIndexRequest;
use Taily\Http\Requests\FormTemplateRequest;
use Taily\Http\Resources\FormTemplateResource;
use Taily\Models\FormTemplate;
use Taily\Support\CustomFields\CustomFieldCleanup;
use Taily\Support\CustomFields\CustomFieldKeys;
use Taily\Support\FormTemplateService;

class FormTemplateController extends Controller
{
    public function __construct(
        private FormTemplateService $service
    ) {}

    /**
     * List form templates with their latest version and total submission
     * count, ordered by name (see CatalogIndexRequest). `per_page=0` only
     * counts. Without any list parameter all templates are returned, which
     * the pickers in other forms still rely on.
     */
    public function index(CatalogIndexRequest $request): AnonymousResourceCollection|JsonResponse
    {
        if (! $request->wantsListView()) {
            $templates = FormTemplate::with(['latestVersion', 'customFieldGroups'])->withCount('formSubmissions')->get();

            return response()->json(['data' => FormTemplateResource::collection($templates)]);
        }

        if ($request->perPage() === 0) {
            return $request->countResponse(FormTemplate::query());
        }

        return FormTemplateResource::collection(
            FormTemplate::with(['latestVersion', 'customFieldGroups'])
                ->withCount('formSubmissions')
                ->orderBy('name')
                ->orderBy('id')
                ->paginate($request->perPage())
        );
    }

    /**
     * Create a new form template with an initial version.
     */
    public function store(FormTemplateRequest $request): JsonResponse
    {
        $template = $this->service->createTemplate($request->validated());

        return response()->json([
            'message' => 'Formularvorlage erfolgreich erstellt.',
            'data' => new FormTemplateResource($template),
        ], 201);
    }

    /**
     * Display a form template with its latest version, all versions, and submission counts.
     */
    public function show(FormTemplate $formTemplate): JsonResponse
    {
        $formTemplate->load([
            'latestVersion',
            'customFieldGroups',
            'versions' => fn ($q) => $q->withCount('formSubmissions')->orderBy('version', 'desc'),
        ]);
        $formTemplate->loadCount('formSubmissions');

        return response()->json(['data' => new FormTemplateResource($formTemplate)]);
    }

    /**
     * Update a form template. Non-breaking changes update the current version in place;
     * breaking schema changes create a new version automatically.
     */
    public function update(FormTemplateRequest $request, FormTemplate $formTemplate, CustomFieldCleanup $cleanup, CustomFieldKeys $keys): JsonResponse
    {
        $formTemplate->load(['latestVersion', 'customFieldGroups.formTemplate.latestVersion']);
        $latestVersion = $formTemplate->latestVersion;

        if (! $latestVersion) {
            return response()->json(['message' => 'Keine Version gefunden.'], 404);
        }

        $data = $request->validated();

        // A template bound as custom fields: new keys must stay unique per
        // entity, and removed fields, options or changed types delete values,
        // which needs the confirmation flag (409 with the impact otherwise).
        $removals = [];
        foreach ($formTemplate->customFieldGroups as $group) {
            $newKeys = array_keys($data['schema']['properties'] ?? []);

            if ($conflict = $keys->conflict($group->entity, $newKeys, $group->id)) {
                throw ValidationException::withMessages(['schema' => [$conflict]]);
            }

            array_push($removals, ...$cleanup->templateChangeImpact($group, $data['schema'], $data['ui_schema'] ?? null));
        }

        if ($removals !== [] && ! $request->boolean(CustomFieldCleanup::CONFIRM_FLAG)) {
            return $cleanup->conflictResponse($removals);
        }

        ['template' => $template, 'new_version_created' => $newVersionCreated] = DB::transaction(function () use ($formTemplate, $latestVersion, $data, $cleanup, $removals) {
            $cleanup->remove($removals);

            return $this->service->updateTemplate($formTemplate, $latestVersion, $data);
        });
        $template->load('customFieldGroups');

        $message = $newVersionCreated
            ? 'Neue Version der Formularvorlage erstellt.'
            : 'Formularvorlage aktualisiert.';

        return response()->json([
            'message' => $message,
            'new_version_created' => $newVersionCreated,
            'data' => new FormTemplateResource($template),
        ]);
    }

    /**
     * Validate a data payload against the template's latest version schema.
     */
    public function validateData(Request $request, FormTemplate $formTemplate): JsonResponse
    {
        $formTemplate->load('latestVersion');
        $version = $formTemplate->latestVersion;

        if (! $version) {
            return response()->json(['message' => 'Keine Version gefunden.'], 404);
        }

        $request->validate(['data' => ['required', 'array']]);

        $result = $this->service->validateSubmissionData($version, $request->input('data'));

        return response()->json([
            'valid' => $result['valid'],
            'errors' => $result['errors'],
        ], $result['valid'] ? 200 : 422);
    }
}
