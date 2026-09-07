<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

        $hasActiveProcess = $adoption->contractSigningProcesses()
            ->whereIn('status', self::ACTIVE_STATUSES)
            ->exists();

        if ($hasActiveProcess) {
            throw ValidationException::withMessages([
                'template' => ['Für diese Vermittlung läuft bereits ein Signaturvorgang.'],
            ]);
        }

        $unsignedPdf = $this->pdfService->generate($adoption, $validated['template']);
        $process = $this->signingService->start($adoption, $validated['template'], $unsignedPdf);

        $process->load('signers.person');
        $mediatorSigner = $process->signers->firstWhere('role', ContractSignerRole::MEDIATOR);

        if ($mediatorSigner->person->email) {
            Mail::to($mediatorSigner->person->email)->send(
                new ContractSignerInviteMail($mediatorSigner, $mediatorSigner->activeToken()->token)
            );
            $this->signingService->recordEmailSent($mediatorSigner);
        }

        $adoption->load(self::DETAIL_RELATIONS);

        return response()->json([
            'message' => 'Signaturvorgang erfolgreich gestartet.',
            'data' => new AdoptionDetailResource($adoption),
        ], 201);
    }
}
