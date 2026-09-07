<?php

namespace Taily\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Taily\Enums\ContractSignerRole;
use Taily\Mail\ContractCompletionMail;
use Taily\Models\Adoption;
use Taily\Models\ContractSigningProcess;
use Throwable;

/**
 * Assembles the final artifact once both signatures are in: a single
 * re-rendered PDF (contract + signatures + audit trail, see
 * ContractPdfService::generateFinal()), stored on the signing process and
 * copied onto the adoption itself, then notifies both signers.
 */
class ContractCompletionService
{
    public function __construct(
        private ContractPdfService $pdfService,
        private ContractSigningService $signingService,
    ) {}

    public function complete(ContractSigningProcess $process): void
    {
        $process->load([
            'adoption.animal.animalType',
            'adoption.mediator.organization',
            'adoption.applicant',
            'signers.person',
            'auditEvents.signer.person',
        ]);

        $finalBytes = $this->pdfService->generateFinal($process);
        $hash = hash('sha256', $finalBytes);

        // The adoption row is locked here under the same lock that
        // ContractSigningController::store() takes before its contract_signed
        // check, closing the race where a new signing process could be
        // started while completion for this adoption is in flight. Media
        // writes and both state transitions happen inside the same
        // transaction: leaving the adoption marked as signed without a
        // matching final_document_hash on the process (or media written
        // without either) would be an inconsistent, half-completed state.
        $adoption = DB::transaction(function () use ($process, $finalBytes, $hash) {
            $adoption = Adoption::whereKey($process->adoption_id)->with('animal')->lockForUpdate()->firstOrFail();

            $process->addMediaFromString($finalBytes)
                ->usingFileName('final.pdf')
                ->toMediaCollection('final');

            $adoption->clearMediaCollection('contract');
            $adoption->addMediaFromString($finalBytes)
                ->usingFileName($this->pdfService->filename($adoption))
                ->toMediaCollection('contract');

            $adoption->contract_signed = true;
            $adoption->contract_signed_at = now();
            $adoption->save();

            $this->signingService->finalize($process, $hash);

            return $adoption;
        });

        $downloadUrl = $adoption->getFirstMedia('contract')->getTemporaryUrl(now()->addDays(7));

        $mediatorSigner = $process->signers->firstWhere('role', ContractSignerRole::MEDIATOR);
        $adopterSigner = $process->signers->firstWhere('role', ContractSignerRole::ADOPTER);

        foreach ([$mediatorSigner, $adopterSigner] as $signer) {
            if (! $signer?->person?->email) {
                continue;
            }

            try {
                Mail::to($signer->person->email)->send(
                    new ContractCompletionMail($adoption, $downloadUrl, $signer->person->full_name)
                );
            } catch (Throwable $e) {
                // The signature request is already finalized at this point,
                // so a mail delivery failure to one signer must not stop
                // the other from being notified, or fail the request.
                Log::error('Failed to send contract completion mail', [
                    'signing_process_id' => $process->id,
                    'signer_id' => $signer->id,
                    'exception' => $e,
                ]);
            }
        }
    }
}
