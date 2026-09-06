<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\Rule;
use Taily\Http\Controllers\Controller;
use Taily\Http\Resources\AdoptionDetailResource;
use Taily\Models\Adoption;
use Taily\Support\ContractPdfService;

class AdoptionContractController extends Controller
{
    private const DETAIL_RELATIONS = [
        'animal', 'animal.animalType', 'animal.media',
        'mediator', 'mediator.media',
        'applicant', 'applicant.media',
        'media',
    ];

    public function store(Request $request, Adoption $adoption): JsonResponse
    {
        // multiform data needs us to convert an empty date string to null
        $request->merge([
            'contract_signed_at' => $request->input('contract_signed_at') ?: null,
        ]);

        $validated = $request->validate([
            'contract_signed' => 'required|boolean',
            'contract_signed_at' => 'sometimes|nullable|date',
            'file' => 'sometimes|nullable|file|mimes:pdf,jpg,jpeg,png,webp|max:20480',
            'remove_file' => 'sometimes|boolean',
        ]);

        $adoption->contract_signed = $request->boolean('contract_signed');

        if ($request->has('contract_signed_at')) {
            $adoption->contract_signed_at = $validated['contract_signed_at'];
        }

        $adoption->save();

        if ($request->hasFile('file')) {
            $adoption->clearMediaCollection('contract');
            $adoption->addMedia($request->file('file'))->toMediaCollection('contract');
        } elseif ($request->boolean('remove_file')) {
            $adoption->clearMediaCollection('contract');
        }

        $adoption->load(self::DETAIL_RELATIONS);

        return response()->json([
            'message' => 'Schutzvertrag erfolgreich gespeichert.',
            'data' => new AdoptionDetailResource($adoption),
        ]);
    }

    public function templates(): JsonResponse
    {
        $templates = collect(config('taily.contracts'))
            ->map(fn (array $template, string $key) => [
                'key' => $key,
                'label' => $template['label'],
            ])
            ->values();

        return response()->json($templates);
    }

    /**
     * Authorizes a contract download and hands back a signed URL for it.
     *
     * The actual PDF is served by the unauthenticated `download` action
     * below — its signature (not a session cookie) is the auth mechanism,
     * so the frontend can open it as a plain link. See ADR on why: a direct
     * `auth:sanctum`-protected download opened via <a target="_blank">
     * depends on the browser sending a Referer/Origin header for Sanctum to
     * recognize it as a stateful frontend request, which isn't guaranteed
     * (e.g. rel="noreferrer", strict referrer policies, some extensions).
     */
    public function generate(Request $request, Adoption $adoption): JsonResponse
    {
        $validated = $request->validate([
            'template' => ['required', 'string', Rule::in(array_keys(config('taily.contracts')))],
        ]);

        $url = URL::temporarySignedRoute('adoptions.contract.download', now()->addHour(), [
            'adoption' => $adoption->id,
            'template' => $validated['template'],
        ]);

        return response()->json(['url' => $url]);
    }

    public function download(Request $request, Adoption $adoption, ContractPdfService $contractPdfService): Response
    {
        if (! $request->hasValidSignature()) {
            abort(403);
        }

        $validated = $request->validate([
            'template' => ['required', 'string', Rule::in(array_keys(config('taily.contracts')))],
        ]);

        $pdf = $contractPdfService->generate($adoption, $validated['template']);

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$contractPdfService->filename($adoption).'"',
            'Cache-Control' => 'no-store',
        ]);
    }
}
