<?php

namespace Taily\Support;

use Illuminate\Support\Facades\Mail;
use Taily\Enums\ContractSignerRole;
use Taily\Mail\ContractCompletionMail;
use Taily\Models\ContractSigningProcess;

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

        $process->addMediaFromString($finalBytes)
            ->usingFileName('final.pdf')
            ->toMediaCollection('final');

        $adoption = $process->adoption;
        $adoption->clearMediaCollection('contract');
        $adoption->addMediaFromString($finalBytes)
            ->usingFileName($this->pdfService->filename($adoption))
            ->toMediaCollection('contract');
        $adoption->contract_signed = true;
        $adoption->contract_signed_at = now();
        $adoption->save();

        $this->signingService->finalize($process, $hash);

        $downloadUrl = $adoption->getFirstMedia('contract')->getTemporaryUrl(now()->addDays(7));

        $mediatorSigner = $process->signers->firstWhere('role', ContractSignerRole::MEDIATOR);
        $adopterSigner = $process->signers->firstWhere('role', ContractSignerRole::ADOPTER);

        foreach ([$mediatorSigner, $adopterSigner] as $signer) {
            if ($signer?->person?->email) {
                Mail::to($signer->person->email)->send(
                    new ContractCompletionMail($adoption, $downloadUrl, $signer->person->full_name)
                );
            }
        }
    }
}
