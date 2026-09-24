<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Taily\Enums\ContractSigningEventParty;
use Taily\Enums\ContractSigningEventType;
use Taily\Support\UserAgentSummary;

class ContractSigningAuditEvent extends Model
{
    use HasUuids;

    const UPDATED_AT = null;

    protected $fillable = [
        'signing_process_id',
        'signer_id',
        'actor_user_id',
        'event_type',
        'occurred_at',
        'ip_address',
        'user_agent',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'event_type' => ContractSigningEventType::class,
            'occurred_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function signingProcess(): BelongsTo
    {
        return $this->belongsTo(ContractSigningProcess::class, 'signing_process_id');
    }

    public function signer(): BelongsTo
    {
        return $this->belongsTo(ContractSigner::class, 'signer_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }

    /**
     * The name of the party this event is about — see the event type's
     * subject(). Prefers the snapshot written with the event over the live
     * record, so a later rename doesn't rewrite what the trail says; rows
     * written before a snapshot existed fall back to the live lookup.
     */
    public function subjectName(): ?string
    {
        return self::present(match ($this->event_type->subject()) {
            ContractSigningEventParty::SIGNER => $this->metadata['person_name'] ?? $this->signer?->person?->full_name,
            ContractSigningEventParty::ACTOR => $this->metadata['actor_name'] ?? $this->actor?->name,
            ContractSigningEventParty::SYSTEM => null,
        });
    }

    /**
     * The email of the party this event is about. For an invite this is the
     * address the mail actually went to, which recordEmailSent() writes
     * over the snapshot rather than leaving to be re-derived later.
     */
    public function subjectEmail(): ?string
    {
        return self::present(match ($this->event_type->subject()) {
            ContractSigningEventParty::SIGNER => $this->metadata['person_email'] ?? $this->signer?->person?->email,
            ContractSigningEventParty::ACTOR => $this->metadata['actor_email'] ?? $this->actor?->email,
            ContractSigningEventParty::SYSTEM => null,
        });
    }

    /**
     * The IP the event came from, or null where no browser was involved.
     *
     * The column is read as the subject's own origin, so it is answered
     * from the event type rather than from whether a value happens to be
     * stored: an invite email carries the IP of the session that triggered
     * the send, which belongs to nobody named on that row.
     */
    public function originIpAddress(): ?string
    {
        return $this->hasOrigin() ? self::present($this->ip_address) : null;
    }

    /**
     * The browser and operating system behind this event, short enough to
     * print, under the same rule as originIpAddress(). The raw header stays
     * in `user_agent` — see UserAgentSummary for why the trail shows the
     * short form rather than that.
     */
    public function originDevice(): ?string
    {
        return $this->hasOrigin() ? UserAgentSummary::summarize($this->user_agent) : null;
    }

    private function hasOrigin(): bool
    {
        return $this->event_type->origin() !== ContractSigningEventParty::SYSTEM;
    }

    /**
     * String columns in this schema default to '' rather than null (see
     * docs/coding-patterns/empty-strings.md), and an empty cell and a
     * missing one mean the same thing to the trail.
     */
    private static function present(?string $value): ?string
    {
        return ($value === null || trim($value) === '') ? null : $value;
    }
}
