<?php

namespace Taily\Support;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Taily\Enums\ContractSignerRole;
use Taily\Enums\ContractSigningEventType;
use Taily\Enums\ContractSigningStatus;
use Taily\Exceptions\ContractSigningStateException;
use Taily\Models\Adoption;
use Taily\Models\ContractSigner;
use Taily\Models\ContractSigningProcess;
use Taily\Models\Person;
use Taily\Models\User;

/**
 * Owns every state transition of the native contract-signing flow. Every
 * transition that mutates an already-started process re-checks the
 * process's status under a row lock before mutating, so a cancellation
 * landing mid-submission can't let a stale signature commit.
 */
class ContractSigningService
{
    private const SIGNER_TOKEN_LIFETIME_DAYS = 14;

    /**
     * Start a brand-new signing process for the given adoption: freezes the
     * unsigned PDF, stores its hash, and issues the mediator's signing link.
     */
    public function start(
        Adoption $adoption,
        string $templateKey,
        string $unsignedPdfBytes,
        ?User $actor = null,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): ContractSigningProcess {
        return DB::transaction(function () use ($adoption, $templateKey, $unsignedPdfBytes, $actor, $ipAddress, $userAgent) {
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
            $this->writeAuditEvent($process, $mediator, ContractSigningEventType::LINK_GENERATED, $ipAddress, $userAgent, actor: $actor);

            return $process;
        });
    }

    /**
     * Audit-log write only, for a mailable to call once the signing link
     * email has actually been sent. $sentToEmail is the literal address the
     * mail was sent to, not re-derived from the signer's current person
     * record, so the trail can't drift from what was actually sent.
     */
    public function recordEmailSent(
        ContractSigner $signer,
        string $sentToEmail,
        ?array $metadata = null,
        ?User $actor = null,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): void {
        $this->writeAuditEvent(
            $signer->signingProcess,
            $signer,
            ContractSigningEventType::EMAIL_SENT,
            $ipAddress,
            $userAgent,
            array_merge($metadata ?? [], ['person_email' => $sentToEmail]),
            $actor,
        );
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

            $this->writeAuditEvent($locked, null, ContractSigningEventType::FINALIZED, metadata: [
                'final_document_hash' => $finalDocumentHash,
            ]);
        });

        $process->refresh();
    }

    /**
     * Full reset: invalidates any outstanding signer tokens and marks the
     * process cancelled. Only the mediator can cancel.
     *
     * @throws ContractSigningStateException if the process is already terminal or completed, or if
     *                                       $canceledBy isn't the adoption's mediator.
     */
    public function cancel(
        ContractSigningProcess $process,
        Person $canceledBy,
        ?string $reason = null,
        ?User $actor = null,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): void {
        if ($process->adoption->mediator_id !== $canceledBy->id) {
            throw new ContractSigningStateException('Nur der Vermittler kann diesen Signaturvorgang abbrechen.');
        }

        DB::transaction(function () use ($process, $canceledBy, $reason, $actor, $ipAddress, $userAgent) {
            $locked = $this->terminate($process, ContractSigningStatus::CANCELLED, $reason);

            $this->writeAuditEvent($locked, null, ContractSigningEventType::CANCELLED, $ipAddress, $userAgent, [
                // "On whose authority" (the mediator, per the check above), as
                // distinct from actor_user_id ("who clicked the button").
                'authorized_by_person_id' => $canceledBy->id,
            ], $actor);
        });

        $process->refresh();
    }

    /**
     * Replaces the currently pending signer's access token and re-sends
     * their invite, without touching the frozen unsigned PDF or the
     * process's status. Reuses the already-generated document, per
     * docs/features/contract.md's "no need to regenerate it" principle.
     * Does not itself write an EMAIL_SENT audit event — the caller does that
     * via recordEmailSent() only once the invite has actually been sent.
     *
     * @throws ContractSigningStateException if the process is no longer active.
     */
    public function resend(ContractSigningProcess $process): ContractSigner
    {
        return DB::transaction(function () use ($process) {
            $locked = ContractSigningProcess::whereKey($process->id)->lockForUpdate()->first();

            if (! $locked || ! $locked->status->isActive()) {
                throw new ContractSigningStateException('Dieser Signaturvorgang befindet sich nicht im erwarteten Status.');
            }

            $pendingRole = $locked->status === ContractSigningStatus::AWAITING_MEDIATOR_SIGNATURE
                ? ContractSignerRole::MEDIATOR
                : ContractSignerRole::ADOPTER;

            $signer = $locked->signers()->where('role', $pendingRole)->firstOrFail();

            $signer->accessTokens()->delete();
            $signer->issueToken(now()->addDays(self::SIGNER_TOKEN_LIFETIME_DAYS));
            $signer->update([
                'week_reminder_sent_at' => null,
                'two_day_reminder_sent_at' => null,
            ]);

            return $signer;
        });
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

    /**
     * Signers with between two and seven days left on their active signing
     * link who haven't been sent the week-out reminder yet. Floored at two
     * days so this window never overlaps signersDueForTwoDayReminder()'s —
     * without that floor, a signer inside both windows would get both
     * emails in the same run, since markReminderSent() only stamps the
     * threshold it was called for.
     *
     * @return Collection<int, ContractSigner>
     */
    public function signersDueForWeekReminder(): Collection
    {
        return $this->signersDueForReminder('week_reminder_sent_at', 7, 2);
    }

    /**
     * Signers with two days or less left on their active signing link who
     * haven't been sent the two-day-out reminder yet.
     *
     * @return Collection<int, ContractSigner>
     */
    public function signersDueForTwoDayReminder(): Collection
    {
        return $this->signersDueForReminder('two_day_reminder_sent_at', 2);
    }

    /**
     * @return Collection<int, ContractSigner>
     */
    private function signersDueForReminder(string $reminderColumn, int $daysRemaining, int $daysRemainingFloor = 0): Collection
    {
        return ContractSigner::query()
            ->whereNull('signed_at')
            ->whereNull($reminderColumn)
            ->whereHas('signingProcess', fn ($query) => $query->whereIn('status', ContractSigningStatus::activeStatuses()))
            ->whereHas('accessTokens', fn ($query) => $query
                ->where('expires_at', '>', now()->addDays($daysRemainingFloor))
                ->where('expires_at', '<=', now()->addDays($daysRemaining))
            )
            ->get();
    }

    /**
     * Signers whose active signing process is still awaiting their
     * signature but whose token has expired without one — mirrors
     * HasAccessToken::activeToken()'s "no unexpired token remains" check
     * rather than a raw expires_at filter, so a signer who never had a
     * token issued is treated the same as one whose token expired.
     *
     * @return Collection<int, ContractSigner>
     */
    public function signersPastExpiry(): Collection
    {
        return ContractSigner::query()
            ->whereNull('signed_at')
            ->whereHas('signingProcess', fn ($query) => $query->whereIn('status', ContractSigningStatus::activeStatuses()))
            ->whereDoesntHave('accessTokens', fn ($query) => $query->where('expires_at', '>', now()))
            ->get();
    }

    /**
     * Marks the given reminder threshold as sent for a signer and writes
     * the matching audit event, so a command run twice between thresholds
     * never sends the same reminder to the same signer more than once.
     */
    public function markReminderSent(ContractSigner $signer, string $threshold): void
    {
        $column = match ($threshold) {
            'week' => 'week_reminder_sent_at',
            'two_days' => 'two_day_reminder_sent_at',
            default => throw new InvalidArgumentException("Unknown reminder threshold: {$threshold}"),
        };

        $signer->update([$column => now()]);

        $this->writeAuditEvent($signer->signingProcess, $signer, ContractSigningEventType::EMAIL_SENT, metadata: [
            'type' => 'reminder',
            'threshold' => $threshold,
        ]);
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

        $signer->issueToken(now()->addDays(self::SIGNER_TOKEN_LIFETIME_DAYS));

        return $signer;
    }

    /**
     * When $signer is present, always snapshots their current name/email
     * into metadata, so the trail keeps showing who it actually went to even
     * if that Person's name or email changes later. Caller-supplied
     * $metadata keys (e.g. recordEmailSent()'s literal sent-to address) win
     * over the snapshot's defaults. Likewise, when $actor is present, its
     * name/email are snapshotted too: actor_user_id is nullOnDelete, so
     * deleting that User account must not erase who performed the action
     * from an already-written audit event.
     */
    private function writeAuditEvent(
        ContractSigningProcess $process,
        ?ContractSigner $signer,
        ContractSigningEventType $eventType,
        ?string $ipAddress = null,
        ?string $userAgent = null,
        ?array $metadata = null,
        ?User $actor = null,
    ): void {
        if ($signer) {
            $signer->loadMissing('person');
            $metadata = array_merge([
                'person_name' => $signer->person->full_name,
                'person_email' => $signer->person->email,
            ], $metadata ?? []);
        }

        if ($actor) {
            $metadata = array_merge([
                'actor_name' => $actor->name,
                'actor_email' => $actor->email,
            ], $metadata ?? []);
        }

        $process->auditEvents()->create([
            'signer_id' => $signer?->id,
            'actor_user_id' => $actor?->id,
            'event_type' => $eventType,
            'occurred_at' => now(),
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'metadata' => $metadata,
        ]);
    }
}
