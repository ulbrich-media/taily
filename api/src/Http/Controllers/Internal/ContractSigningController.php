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
use Taily\Mail\ContractSigningCancelledMail;
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

        if (! $adoption->applicant?->email) {
            throw ValidationException::withMessages([
                'template' => ['Der Adoptant hat keine E-Mail-Adresse hinterlegt.'],
            ]);
        }

        // The contract_signed check, the active-process check, and the
        // process creation all run against the same row-locked instance, and
        // under the same adoption lock that ContractCompletionService::complete()
        // takes. This closes two races: two concurrent requests both passing
        // the active-process check, and a request starting a new process for
        // an adoption whose completion is concurrently in flight.
        $process = DB::transaction(function () use ($adoption, $validated) {
            $lockedAdoption = Adoption::whereKey($adoption->id)->lockForUpdate()->firstOrFail();

            if ($lockedAdoption->contract_signed) {
                throw ValidationException::withMessages([
                    'template' => ['Der Vertrag für diese Vermittlung ist bereits unterschrieben.'],
                ]);
            }

            $hasActiveProcess = $lockedAdoption->contractSigningProcesses()
                ->whereIn('status', ContractSigningStatus::activeStatuses())
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

    /**
     * Cancels the adoption's active signing process: invalidates every
     * outstanding signer token and, if the adopter was the one holding the
     * pending signature, emails them a cancellation notice.
     */
    public function cancel(Adoption $adoption): JsonResponse
    {
        // Locking the adoption row (not just the process) matches store()'s
        // race-closing pattern: a concurrent cancel for the same adoption
        // re-reads latestContractSigningProcess only after the first cancel
        // has committed and released the lock.
        [$process, $pendingRole] = DB::transaction(function () use ($adoption) {
            Adoption::whereKey($adoption->id)->lockForUpdate()->firstOrFail();

            $process = $adoption->latestContractSigningProcess()->first();

            if (! $process || ! $process->status->isActive()) {
                throw ValidationException::withMessages([
                    'signing' => ['Für diese Vermittlung läuft aktuell kein Signaturvorgang.'],
                ]);
            }

            $pendingRole = $process->status === ContractSigningStatus::AWAITING_MEDIATOR_SIGNATURE
                ? ContractSignerRole::MEDIATOR
                : ContractSignerRole::ADOPTER;

            $this->signingService->cancel($process, $adoption->mediator);

            return [$process, $pendingRole];
        });

        if ($pendingRole === ContractSignerRole::ADOPTER) {
            $process->load('signers.person');
            $adopterSigner = $process->signers->firstWhere('role', ContractSignerRole::ADOPTER);

            if ($adopterSigner?->person?->email) {
                try {
                    $adoption->loadMissing('animal');

                    Mail::to($adopterSigner->person->email)->send(
                        new ContractSigningCancelledMail($adopterSigner, $adoption->animal->name)
                    );
                } catch (Throwable $e) {
                    // The cancellation is already committed at this point, so
                    // a mail delivery failure must not turn into a 500 for
                    // the mediator who just triggered the cancellation.
                    Log::error('Failed to send contract signing cancellation notice to adopter', [
                        'signing_process_id' => $process->id,
                        'exception' => $e,
                    ]);
                }
            }
        }

        $adoption->load(self::DETAIL_RELATIONS);

        return response()->json([
            'message' => 'Signaturvorgang erfolgreich abgebrochen.',
            'data' => new AdoptionDetailResource($adoption),
        ]);
    }
}
