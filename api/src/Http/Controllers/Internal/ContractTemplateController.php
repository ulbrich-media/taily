<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Taily\Http\Controllers\Controller;
use Taily\Models\ContractTemplate;
use Taily\Support\ContractTemplateService;

/**
 * Administration of contract templates (ADR-017). Templates are archived
 * rather than deleted: signing processes refer to the template they were
 * generated from.
 */
class ContractTemplateController extends Controller
{
    public function __construct(
        private ContractTemplateService $templates,
    ) {
        $this->middleware('admin');
    }

    public function index(): JsonResponse
    {
        $templates = ContractTemplate::with('animalTypes')->orderBy('name')->get();

        return response()->json($templates->map(fn (ContractTemplate $template) => $this->present($template)));
    }

    public function fieldOptions(): JsonResponse
    {
        return response()->json($this->templates->fieldOptions());
    }

    public function show(ContractTemplate $contractTemplate): JsonResponse
    {
        return response()->json($this->present($contractTemplate->load('animalTypes')));
    }

    public function store(Request $request): JsonResponse
    {
        $template = $this->templates->save(new ContractTemplate, $request->all());

        return response()->json([
            'message' => 'Vertragsvorlage angelegt.',
            'data' => $this->present($template),
        ], 201);
    }

    public function update(Request $request, ContractTemplate $contractTemplate): JsonResponse
    {
        $template = $this->templates->save($contractTemplate, $request->all());

        return response()->json([
            'message' => 'Vertragsvorlage gespeichert.',
            'data' => $this->present($template),
        ]);
    }

    public function archive(ContractTemplate $contractTemplate): JsonResponse
    {
        $contractTemplate->update(['archived_at' => now()]);

        return response()->json([
            'message' => 'Vertragsvorlage archiviert.',
            'data' => $this->present($contractTemplate->load('animalTypes')),
        ]);
    }

    public function restore(ContractTemplate $contractTemplate): JsonResponse
    {
        $contractTemplate->update(['archived_at' => null]);

        return response()->json([
            'message' => 'Vertragsvorlage wiederhergestellt.',
            'data' => $this->present($contractTemplate->load('animalTypes')),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(ContractTemplate $template): array
    {
        return [
            'id' => $template->id,
            'name' => $template->name,
            'title' => $template->title,
            'body' => $template->body,
            'animal_types' => $template->animalTypes
                ->sortBy('title')
                ->map(fn ($type) => ['id' => $type->id, 'title' => $type->title])
                ->values(),
            'animal_fields' => $template->section('animal'),
            'mediator_fields' => $template->section('mediator'),
            'adopter_fields' => $template->section('adopter'),
            'archived_at' => $template->archived_at,
            'updated_at' => $template->updated_at,
        ];
    }
}
