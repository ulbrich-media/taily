<?php

namespace Taily\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Taily\Enums\ContractSignerRole;
use Taily\Exceptions\ContractDocumentIntegrityException;
use Taily\Mail\ContractCompletionMail;
use Taily\Models\Adoption;
use Taily\Models\ContractSigningProcess;
use Throwable;

/**
 * Assembles the final artifact once both signatures are in: the frozen
 * unsigned PDF with a signature-and-audit-trail appendix appended to it (see
 * ContractPdfService::appendSignaturePages()), stored on the signing process
 * and copied onto the adoption itself, then notifies both signers.
 *
 * The contract body is never re-rendered here. Completion reads the frozen
 * document and nothing else, so neither a later template edit nor a change to
 * the adoption's data can alter what the signers agreed to. See ADR-013.
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

        $finalBytes = $this->pdfService->appendSignaturePages($this->frozenDocument($process), $process);
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

    /**
     * The frozen unsigned PDF, verified against the hash recorded when the
     * process started.
     *
     * This is the one point where `unsigned_document_hash` is actually
     * checked rather than merely stored. Every signature event commits to
     * this hash, so if the bytes on disk no longer match it, the document
     * about to be wrapped in a signature appendix is not the document anyone
     * agreed to — refusing is the only honest outcome.
     *
     * @throws ContractDocumentIntegrityException if the document is missing or altered.
     */
    private function frozenDocument(ContractSigningProcess $process): string
    {
        $media = $process->getFirstMedia('document');

        if (! $media) {
            throw new ContractDocumentIntegrityException(
                "Signing process {$process->id} has no frozen contract document to complete."
            );
        }

        $bytes = Storage::disk($media->disk)->get($media->getPathRelativeToRoot());

        if (! is_string($bytes) || ! hash_equals($process->unsigned_document_hash, hash('sha256', $bytes))) {
            throw new ContractDocumentIntegrityException(
                "Frozen contract document for signing process {$process->id} no longer matches its recorded hash."
            );
        }

        return $bytes;
    }
}
