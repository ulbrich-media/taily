<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Taily\Http\Controllers\Controller;
use Taily\Http\Requests\FormTemplateRequest;
use Taily\Http\Resources\FormTemplateResource;
use Taily\Models\FormTemplate;
use Taily\Support\FormTemplateService;

class FormTemplateController extends Controller
{
    public function __construct(
        private FormTemplateService $service
    ) {}

    /**
     * List all form templates with their latest version and total submission count.
     */
    public function index(): JsonResponse
    {
        $templates = FormTemplate::with('latestVersion')->withCount('formSubmissions')->get();

        return response()->json(['data' => FormTemplateResource::collection($templates)]);
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
            'versions' => fn ($q) => $q->withCount('formSubmissions')->orderBy('version', 'desc'),
        ]);
        $formTemplate->loadCount('formSubmissions');

        return response()->json(['data' => new FormTemplateResource($formTemplate)]);
    }

    /**
     * Update a form template. Non-breaking changes update the current version in place;
     * breaking schema changes create a new version automatically.
     */
    public function update(FormTemplateRequest $request, FormTemplate $formTemplate): JsonResponse
    {
        $formTemplate->load('latestVersion');
        $latestVersion = $formTemplate->latestVersion;

        if (! $latestVersion) {
            return response()->json(['message' => 'Keine Version gefunden.'], 404);
        }

        ['template' => $template, 'new_version_created' => $newVersionCreated] =
            $this->service->updateTemplate($formTemplate, $latestVersion, $request->validated());

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
