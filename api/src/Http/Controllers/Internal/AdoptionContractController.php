<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\ValidationException;
use Taily\Enums\ContractSigningStatus;
use Taily\Http\Controllers\Controller;
use Taily\Http\Resources\AdoptionDetailResource;
use Taily\Models\Adoption;
use Taily\Models\ContractTemplate;
use Taily\Support\CaseFile\CaseFileService;
use Taily\Support\ContractPdfService;
use Taily\Support\ContractTemplateService;

class AdoptionContractController extends Controller
{
    private const DETAIL_RELATIONS = [
        'animal', 'animal.animalType', 'animal.media',
        'mediator', 'mediator.media',
        'applicantPerson', 'applicantPerson.media',
        'media',
        'latestContractSigningProcess.signers.person',
        'latestContractSigningProcess.signers.latestInviteEvent',
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

        // Manual edits and the native signing flow are mutually exclusive.
        // The check and the save share one adoption lock, the same one
        // ContractSigningController::store() and ContractCompletionService
        // take, so a signing process cannot start or complete in between.
        DB::transaction(function () use ($adoption, $request, $validated) {
            $locked = Adoption::whereKey($adoption->id)->lockForUpdate()->firstOrFail();
            $process = $locked->latestContractSigningProcess()->first();

            if ($process?->status->isActive()) {
                throw ValidationException::withMessages([
                    'contract_signed' => ['Es läuft ein Signaturvorgang. Bitte brich ihn ab, bevor du den Vertrag manuell bearbeitest.'],
                ]);
            }

            if ($process?->status === ContractSigningStatus::COMPLETED) {
                throw ValidationException::withMessages([
                    'contract_signed' => ['Der Vertrag wurde digital unterschrieben und kann nicht manuell geändert werden.'],
                ]);
            }

            $adoption->contract_signed = $request->boolean('contract_signed');

            if ($request->has('contract_signed_at')) {
                $adoption->contract_signed_at = $validated['contract_signed_at'];
            }

            $adoption->save();

            // The file changes stay under the same lock: once it is released,
            // a signing process can complete and write its signed PDF to this
            // collection, which a delayed manual save must not clear or replace.
            if ($request->hasFile('file')) {
                $adoption->clearMediaCollection('contract');
                $adoption->addMedia($request->file('file'))->toMediaCollection('contract');
            } elseif ($request->boolean('remove_file')) {
                $adoption->clearMediaCollection('contract');
            }
        });

        $adoption->load(self::DETAIL_RELATIONS);

        return response()->json([
            'message' => 'Schutzvertrag erfolgreich gespeichert.',
            'data' => new AdoptionDetailResource($adoption),
        ]);
    }

    /**
     * The contract templates offered for the adoption's animal type.
     */
    public function templates(Adoption $adoption, ContractTemplateService $templates): JsonResponse
    {
        return response()->json($templates->offeredFor($adoption)->map(fn (ContractTemplate $template) => [
            'key' => $template->id,
            'label' => $template->name,
        ])->values());
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
    public function generate(Request $request, Adoption $adoption, CaseFileService $caseFile, ContractTemplateService $templates): JsonResponse
    {
        $template = $templates->chosen($adoption, $request->query('template'));

        $caseFile->assertContractComplete($adoption, $template);

        $url = URL::temporarySignedRoute('adoptions.contract.download', now()->addHour(), [
            'adoption' => $adoption->id,
            'template' => $template->id,
        ]);

        return response()->json(['url' => $url]);
    }

    public function download(Request $request, Adoption $adoption, ContractPdfService $contractPdfService): Response
    {
        if (! $request->hasValidSignature()) {
            abort(403);
        }

        // The signature vouches for the choice; the template may have been
        // archived since, which doesn't make the link invalid.
        $template = ContractTemplate::findOrFail($request->query('template'));

        $pdf = $contractPdfService->generate($adoption, $template);

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$contractPdfService->filename($adoption).'"',
            'Cache-Control' => 'no-store',
        ]);
    }
}
