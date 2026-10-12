<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Taily\Enums\ContractSigningEventParty;
use Taily\Enums\ContractSigningStatus;

class ContractSigningProcess extends Model implements HasMedia
{
    use HasUuids;

    /** @use InteractsWithMedia<Media> */
    use InteractsWithMedia;

    protected $attributes = [
        'cancellation_reason' => '',
    ];

    protected $fillable = [
        'adoption_id',
        'template_key',
        'status',
        'unsigned_document_hash',
        'final_document_hash',
        'completed_at',
        'terminated_at',
        'cancellation_reason',
    ];

    protected function casts(): array
    {
        return [
            'status' => ContractSigningStatus::class,
            'completed_at' => 'datetime',
            'terminated_at' => 'datetime',
        ];
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('document')->singleFile()->useDisk('contract-signing-document');
        // Holds the re-rendered PDF (both signatures + audit trail appendix)
        // produced once the process completes. `document` is kept alongside
        // it, unsigned, so the two can later be compared to check for drift.
        $this->addMediaCollection('final')->singleFile()->useDisk('contract-signing-document');
    }

    public function adoption(): BelongsTo
    {
        return $this->belongsTo(Adoption::class);
    }

    public function signers(): HasMany
    {
        return $this->hasMany(ContractSigner::class, 'signing_process_id');
    }

    public function auditEvents(): HasMany
    {
        return $this->hasMany(ContractSigningAuditEvent::class, 'signing_process_id')
            ->orderBy('occurred_at')
            ->orderBy('id');
    }

    /**
     * The events belonging in $signer's own section of the audit trail:
     * the ones that are about them, as opposed to the ones that merely
     * happened while their process was running.
     *
     * @return Collection<int, ContractSigningAuditEvent>
     */
    public function auditEventsFor(ContractSigner $signer): Collection
    {
        return $this->auditEvents
            ->filter(fn (ContractSigningAuditEvent $event) => $event->event_type->subject() === ContractSigningEventParty::SIGNER
                && $event->signer_id === $signer->id)
            ->values();
    }

    /**
     * Everything the signer sections do not claim — the events about the
     * process itself rather than about a party to it.
     *
     * Deliberately the complement of auditEventsFor() rather than a filter
     * of its own: written as two independent filters, an event neither one
     * matched would vanish from the certificate silently, and a row of an
     * audit trail going unprinted is the one outcome worth designing
     * against, however unreachable it currently is.
     *
     * @return Collection<int, ContractSigningAuditEvent>
     */
    public function processAuditEvents(): Collection
    {
        $signerIds = $this->signers->pluck('id');

        return $this->auditEvents
            ->reject(fn (ContractSigningAuditEvent $event) => $event->event_type->subject() === ContractSigningEventParty::SIGNER
                && $signerIds->contains($event->signer_id))
            ->values();
    }
}
