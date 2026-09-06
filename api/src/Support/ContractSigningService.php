<?php

namespace Taily\Support;

use Illuminate\Support\Facades\DB;
use Taily\Enums\ContractSignerRole;
use Taily\Enums\ContractSigningEventType;
use Taily\Enums\ContractSigningStatus;
use Taily\Exceptions\ContractSigningStateException;
use Taily\Models\Adoption;
use Taily\Models\ContractSigner;
use Taily\Models\ContractSigningProcess;
use Taily\Models\Person;

/**
 * Owns every state transition of the native contract-signing flow. Every
 * transition that mutates an already-started process re-checks the
 * process's status under a row lock before mutating, so a cancellation
 * landing mid-submission can't let a stale signature commit.
 */
class ContractSigningService
{
    private const SIGNER_TOKEN_LIFETIME_WEEKS = 2;

    /**
     * Start a brand-new signing process for the given adoption: freezes the
     * unsigned PDF, stores its hash, and issues the mediator's signing link.
     */
    public function start(Adoption $adoption, string $templateKey, string $unsignedPdfBytes): ContractSigningProcess
    {
        return DB::transaction(function () use ($adoption, $templateKey, $unsignedPdfBytes) {
            $process = ContractSigningProcess::create([
                'adoption_id' => $adoption->id,
                'template_key' => $templateKey,
                'status' => ContractSigningStatus::AWAITING_MEDIATOR_SIGNATURE,
                'unsigned_document_hash' => hash('sha256', $unsignedPdfBytes),
            ]);

            $process->addMediaFromString($unsignedPdfBytes)
                ->usingFileName('unsigned.pdf')
                ->toMediaCollection('document');

            $mediator = $this->createSigner($process, $adoption->mediator, ContractSignerRole::MEDIATOR);
            $this->writeAuditEvent($process, $mediator, ContractSigningEventType::LINK_GENERATED);

            return $process;
        });
    }

    /**
     * Audit-log write only, for a future mailable to call once the signing
     * link email has actually been sent.
     */
    public function recordEmailSent(ContractSigner $signer): void
    {
        $this->writeAuditEvent($signer->signingProcess, $signer, ContractSigningEventType::EMAIL_SENT);
    }

    public function recordLinkOpened(ContractSigner $signer, string $ipAddress, string $userAgent): void
    {
        $this->writeAuditEvent($signer->signingProcess, $signer, ContractSigningEventType::LINK_OPENED, $ipAddress, $userAgent);
    }

    /**
     * Record the mediator's signature and hand off to the adopter.
     *
     * @throws ContractSigningStateException if the process is no longer awaiting the mediator's signature.
     */
    public function recordMediatorSignature(
        ContractSigningProcess $process,
        string $typedName,
        bool $contractContentAccepted,
        bool $privacyPolicyAccepted,
        bool $informationConfirmed,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): void {
        DB::transaction(function () use ($process, $typedName, $contractContentAccepted, $privacyPolicyAccepted, $informationConfirmed, $ipAddress, $userAgent) {
            $locked = $this->lockProcessInStatus($process, ContractSigningStatus::AWAITING_MEDIATOR_SIGNATURE);

            $mediator = $locked->signers()->where('role', ContractSignerRole::MEDIATOR)->firstOrFail();
            $this->applySignature($mediator, $typedName, $contractContentAccepted, $privacyPolicyAccepted, $informationConfirmed);
            $this->writeAuditEvent($locked, $mediator, ContractSigningEventType::SIGNATURE_SUBMITTED, $ipAddress, $userAgent);

            $locked->status = ContractSigningStatus::AWAITING_ADOPTER_SIGNATURE;
            $locked->save();

            $adopter = $this->createSigner($locked, $locked->adoption->applicant, ContractSignerRole::ADOPTER);
            $this->writeAuditEvent($locked, $adopter, ContractSigningEventType::LINK_GENERATED);
        });

        $process->refresh();
    }

    /**
     * Record the adopter's signature, completing the signing process.
     * Does not touch `final_document_hash` — assembling the final artifact
     * is PDF work for a follow-up issue; see finalize().
     *
     * @throws ContractSigningStateException if the process is no longer awaiting the adopter's signature.
     */
    public function recordAdopterSignature(
        ContractSigningProcess $process,
        string $typedName,
        bool $contractContentAccepted,
        bool $privacyPolicyAccepted,
        bool $informationConfirmed,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): void {
        DB::transaction(function () use ($process, $typedName, $contractContentAccepted, $privacyPolicyAccepted, $informationConfirmed, $ipAddress, $userAgent) {
            $locked = $this->lockProcessInStatus($process, ContractSigningStatus::AWAITING_ADOPTER_SIGNATURE);

            $adopter = $locked->signers()->where('role', ContractSignerRole::ADOPTER)->firstOrFail();
            $this->applySignature($adopter, $typedName, $contractContentAccepted, $privacyPolicyAccepted, $informationConfirmed);
            $this->writeAuditEvent($locked, $adopter, ContractSigningEventType::SIGNATURE_SUBMITTED, $ipAddress, $userAgent);

            $locked->status = ContractSigningStatus::COMPLETED;
            $locked->completed_at = now();
            $locked->save();
        });

        $process->refresh();
    }

    /**
     * Narrow hook for a follow-up issue's controller to set the final,
     * assembled artifact's hash once it has been generated.
     *
     * @throws ContractSigningStateException if the process isn't completed, or already finalized.
     */
    public function finalize(ContractSigningProcess $process, string $finalDocumentHash): void
    {
        DB::transaction(function () use ($process, $finalDocumentHash) {
            $locked = ContractSigningProcess::whereKey($process->id)->lockForUpdate()->first();

            if (! $locked || $locked->status !== ContractSigningStatus::COMPLETED || $locked->final_document_hash !== null) {
                throw new ContractSigningStateException('Der Vertrag kann in diesem Status nicht abgeschlossen werden.');
            }

            $locked->final_document_hash = $finalDocumentHash;
            $locked->save();
        });

        $process->refresh();
    }

    /**
     * Full reset: invalidates any outstanding signer tokens and marks the
     * process cancelled. Only the mediator can cancel.
     *
     * @throws ContractSigningStateException if the process is already terminal or completed.
     */
    public function cancel(ContractSigningProcess $process, Person $canceledBy, ?string $reason = null): void
    {
        DB::transaction(function () use ($process, $canceledBy, $reason) {
            $locked = $this->terminate($process, ContractSigningStatus::CANCELLED, $reason);

            $this->writeAuditEvent($locked, null, ContractSigningEventType::CANCELLED, metadata: [
                'canceled_by' => $canceledBy->id,
            ]);
        });

        $process->refresh();
    }

    /**
     * Same shape as cancel(), triggered once a signing link's validity
     * window closes unused. The scheduled command that calls this is
     * explicitly out of scope here.
     *
     * @throws ContractSigningStateException if the process is already terminal or completed.
     */
    public function expire(ContractSigningProcess $process): void
    {
        DB::transaction(function () use ($process) {
            $locked = $this->terminate($process, ContractSigningStatus::EXPIRED, null);

            $this->writeAuditEvent($locked, null, ContractSigningEventType::EXPIRED);
        });

        $process->refresh();
    }

    private function terminate(ContractSigningProcess $process, ContractSigningStatus $status, ?string $reason): ContractSigningProcess
    {
        $locked = ContractSigningProcess::whereKey($process->id)->lockForUpdate()->first();

        $alreadyDone = [ContractSigningStatus::COMPLETED, ContractSigningStatus::CANCELLED, ContractSigningStatus::EXPIRED];

        if (! $locked || in_array($locked->status, $alreadyDone, true)) {
            throw new ContractSigningStateException('Dieser Signaturvorgang wurde bereits abgeschlossen oder beendet.');
        }

        $locked->signers()->get()->each(fn (ContractSigner $signer) => $signer->accessTokens()->delete());

        $locked->status = $status;
        $locked->terminated_at = now();
        $locked->cancellation_reason = $reason ?? '';
        $locked->save();

        return $locked;
    }

    private function lockProcessInStatus(ContractSigningProcess $process, ContractSigningStatus $status): ContractSigningProcess
    {
        $locked = ContractSigningProcess::whereKey($process->id)->lockForUpdate()->first();

        if (! $locked || $locked->status !== $status) {
            throw new ContractSigningStateException('Dieser Signaturvorgang befindet sich nicht im erwarteten Status.');
        }

        return $locked;
    }

    private function applySignature(
        ContractSigner $signer,
        string $typedName,
        bool $contractContentAccepted,
        bool $privacyPolicyAccepted,
        bool $informationConfirmed,
    ): void {
        $signer->update([
            'typed_name' => $typedName,
            'contract_content_accepted' => $contractContentAccepted,
            'privacy_policy_accepted' => $privacyPolicyAccepted,
            'information_confirmed' => $informationConfirmed,
            'signed_at' => now(),
        ]);
    }

    private function createSigner(ContractSigningProcess $process, Person $person, ContractSignerRole $role): ContractSigner
    {
        $signer = $process->signers()->create([
            'person_id' => $person->id,
            'role' => $role,
        ]);

        $signer->issueToken(now()->addWeeks(self::SIGNER_TOKEN_LIFETIME_WEEKS));

        return $signer;
    }

    private function writeAuditEvent(
        ContractSigningProcess $process,
        ?ContractSigner $signer,
        ContractSigningEventType $eventType,
        ?string $ipAddress = null,
        ?string $userAgent = null,
        ?array $metadata = null,
    ): void {
        $process->auditEvents()->create([
            'signer_id' => $signer?->id,
            'event_type' => $eventType,
            'occurred_at' => now(),
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'metadata' => $metadata,
        ]);
    }
}
