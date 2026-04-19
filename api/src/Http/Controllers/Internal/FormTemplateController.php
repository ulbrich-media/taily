<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Taily\Http\Controllers\Controller;
use Taily\Http\Requests\StoreFormTemplateRequest;
use Taily\Http\Requests\UpdateFormTemplateRequest;
use Taily\Http\Resources\FormTemplateResource;
use Taily\Models\FormTemplate;
use Taily\Support\FormTemplateService;

class FormTemplateController extends Controller
{
    public function __construct(
        private FormTemplateService $service
    ) {}

    /**
     * List all form template types, each showing only their latest version.
     */
    public function index(): JsonResponse
    {
        $templates = FormTemplate::whereRaw(
            'version = (SELECT MAX(version) FROM form_templates ft2 WHERE ft2.type = form_templates.type)'
        )->orderBy('type')->get();

        return response()->json(['data' => FormTemplateResource::collection($templates)]);
    }

    /**
     * List all versions of a specific type, ordered newest first.
     */
    public function versions(string $type): JsonResponse
    {
        $templates = FormTemplate::ofType($type)->orderBy('version', 'desc')->get();

        if ($templates->isEmpty()) {
            return response()->json([
                'message' => "Keine Formularvorlagen für Typ \"{$type}\" gefunden.",
            ], 404);
        }

        return response()->json(['data' => FormTemplateResource::collection($templates)]);
    }

    /**
     * Store a new form template. If the type already exists, auto-increments the version.
     */
    public function store(StoreFormTemplateRequest $request): JsonResponse
    {
        $template = $this->service->createTemplate($request->validated());

        return response()->json([
            'message' => 'Formularvorlage erfolgreich erstellt.',
            'data' => new FormTemplateResource($template),
        ], 201);
    }

    /**
     * Display the specified form template.
     */
    public function show(FormTemplate $formTemplate): JsonResponse
    {
        return response()->json(['data' => new FormTemplateResource($formTemplate)]);
    }

    /**
     * Update a form template.
     *
     * The version is bumped automatically when the schema change is breaking
     * (removed properties, type changes, new required fields, tightened constraints).
     * Non-breaking changes (text edits, new optional fields) are applied in place.
     */
    public function update(UpdateFormTemplateRequest $request, FormTemplate $formTemplate): JsonResponse
    {
        ['template' => $template, 'new_version_created' => $newVersionCreated] =
            $this->service->updateTemplate($formTemplate, $request->validated());

        $message = $newVersionCreated
            ? 'Neue Version der Formularvorlage erstellt.'
            : 'Formularvorlage aktualisiert.';

        return response()->json([
            'message' => $message,
            'data' => new FormTemplateResource($template),
        ]);
    }

    /**
     * Validate submitted data against the template's JSON Schema.
     */
    public function validateData(Request $request, FormTemplate $formTemplate): JsonResponse
    {
        $request->validate([
            'data' => ['required', 'array'],
        ]);

        $result = $this->service->validateSubmissionData($formTemplate, $request->input('data'));

        return response()->json([
            'valid' => $result['valid'],
            'errors' => $result['errors'],
        ], $result['valid'] ? 200 : 422);
    }
}
