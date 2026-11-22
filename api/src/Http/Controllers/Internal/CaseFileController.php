<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Taily\Enums\AdoptionStep;
use Taily\Http\Controllers\Controller;
use Taily\Models\Adoption;
use Taily\Support\CaseFile\CaseFileService;

/**
 * The adoption's Case File for the mediator: values, per-adoption
 * requirement overrides and the derived checklists (docs/features/case-file.md).
 */
class CaseFileController extends Controller
{
    public function __construct(
        private CaseFileService $caseFile,
    ) {}

    public function show(Adoption $adoption): JsonResponse
    {
        return response()->json($this->caseFile->present($adoption));
    }

    public function update(Request $request, Adoption $adoption): JsonResponse
    {
        $validated = $request->validate([
            'values' => ['required', 'array'],
        ]);

        $this->caseFile->update($adoption, $validated['values'], $request->user());

        return response()->json([
            'message' => 'Angaben gespeichert.',
            'data' => $this->caseFile->present($adoption),
        ]);
    }

    public function setRequirement(Request $request, Adoption $adoption, string $fieldKey): JsonResponse
    {
        $definition = $this->caseFile->definition($adoption, $fieldKey) ?? abort(404);

        $validated = $request->validate([
            'waived' => ['required', 'boolean'],
            'required_for' => ['nullable', Rule::enum(AdoptionStep::class)],
        ]);

        $this->caseFile->setRequirement(
            $adoption,
            $definition,
            isset($validated['required_for']) ? AdoptionStep::from($validated['required_for']) : null,
            (bool) $validated['waived'],
        );

        return response()->json([
            'message' => 'Anforderung für diese Vermittlung angepasst.',
            'data' => $this->caseFile->present($adoption),
        ]);
    }

    public function clearRequirement(Adoption $adoption, string $fieldKey): JsonResponse
    {
        $definition = $this->caseFile->definition($adoption, $fieldKey) ?? abort(404);

        $this->caseFile->clearRequirement($adoption, $definition);

        return response()->json([
            'message' => 'Anforderung auf den Standard zurückgesetzt.',
            'data' => $this->caseFile->present($adoption),
        ]);
    }
}
