<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Taily\Enums\ContractSignerRole;
use Taily\Enums\ContractSigningStatus;
use Taily\Http\Controllers\Controller;
use Taily\Http\Resources\AdoptionDetailResource;
use Taily\Mail\ContractSignerInviteMail;
use Taily\Models\Adoption;
use Taily\Support\ContractPdfService;
use Taily\Support\ContractSigningService;
use Throwable;

class ContractSigningController extends Controller
{
    private const DETAIL_RELATIONS = [
        'animal', 'animal.animalType', 'animal.media',
        'mediator', 'mediator.media',
        'applicant', 'applicant.media',
        'media',
        'latestContractSigningProcess.signers.person',
    ];

    private const ACTIVE_STATUSES = [
        ContractSigningStatus::AWAITING_MEDIATOR_SIGNATURE,
        ContractSigningStatus::AWAITING_ADOPTER_SIGNATURE,
    ];

    public function __construct(
        private ContractPdfService $pdfService,
        private ContractSigningService $signingService,
    ) {}

    /**
     * Starts the native signing flow: freezes the unsigned PDF into a new
     * signing process and emails the mediator their review-and-sign link.
     */
    public function store(Request $request, Adoption $adoption): JsonResponse
    {
        $validated = $request->validate([
            'template' => ['required', 'string', Rule::in(array_keys(config('taily.contracts')))],
        ]);

        if (! $adoption->mediator_id) {
            throw ValidationException::withMessages([
                'template' => ['Für diese Vermittlung ist kein Vermittler zugewiesen.'],
            ]);
        }

        if (! $adoption->mediator?->email) {
            throw ValidationException::withMessages([
                'template' => ['Der zugewiesene Vermittler hat keine E-Mail-Adresse hinterlegt.'],
            ]);
        }

        // The active-process check and creation are locked together so two
        // concurrent requests for the same adoption can't both pass the
        // check and end up with two active signing processes.
        $process = DB::transaction(function () use ($adoption, $validated) {
            Adoption::whereKey($adoption->id)->lockForUpdate()->firstOrFail();

            $hasActiveProcess = $adoption->contractSigningProcesses()
                ->whereIn('status', self::ACTIVE_STATUSES)
                ->exists();

            if ($hasActiveProcess) {
                throw ValidationException::withMessages([
                    'template' => ['Für diese Vermittlung läuft bereits ein Signaturvorgang.'],
                ]);
            }

            $unsignedPdf = $this->pdfService->generate($adoption, $validated['template']);

            return $this->signingService->start($adoption, $validated['template'], $unsignedPdf);
        });

        $process->load('signers.person');
        $mediatorSigner = $process->signers->firstWhere('role', ContractSignerRole::MEDIATOR);

        try {
            Mail::to($mediatorSigner->person->email)->send(
                new ContractSignerInviteMail($mediatorSigner, $mediatorSigner->activeToken()->token)
            );
            $this->signingService->recordEmailSent($mediatorSigner);
        } catch (Throwable $e) {
            // The process is already committed at this point, so a mail
            // delivery failure must not turn into a 500 for the mediator
            // who just triggered signing.
            Log::error('Failed to send contract signer invite to mediator', [
                'signing_process_id' => $process->id,
                'exception' => $e,
            ]);
        }

        $adoption->load(self::DETAIL_RELATIONS);

        return response()->json([
            'message' => 'Signaturvorgang erfolgreich gestartet.',
            'data' => new AdoptionDetailResource($adoption),
        ], 201);
    }
}
