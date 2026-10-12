<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Taily\Enums\ContractSignerRole;
use Taily\Enums\ContractSigningEventType;
use Taily\Traits\HasAccessToken;

class ContractSigner extends Model
{
    use HasAccessToken, HasUuids;

    protected $fillable = [
        'signing_process_id',
        'person_id',
        'role',
        'signed_at',
        'typed_name',
        'contract_content_accepted',
        'privacy_policy_accepted',
        'information_confirmed',
        'week_reminder_sent_at',
        'two_day_reminder_sent_at',
    ];

    protected function casts(): array
    {
        return [
            'role' => ContractSignerRole::class,
            'signed_at' => 'datetime',
            'contract_content_accepted' => 'boolean',
            'privacy_policy_accepted' => 'boolean',
            'information_confirmed' => 'boolean',
            'week_reminder_sent_at' => 'datetime',
            'two_day_reminder_sent_at' => 'datetime',
        ];
    }

    public function signingProcess(): BelongsTo
    {
        return $this->belongsTo(ContractSigningProcess::class, 'signing_process_id');
    }

    public function person(): BelongsTo
    {
        return $this->belongsTo(Person::class);
    }

    public function auditEvents(): HasMany
    {
        return $this->hasMany(ContractSigningAuditEvent::class, 'signer_id');
    }

    /**
     * The most recent invite mail sent to this signer; a resend writes a new
     * event, so this is always the invite behind the live token.
     */
    public function latestInviteEvent(): HasOne
    {
        return $this->hasOne(ContractSigningAuditEvent::class, 'signer_id')
            ->where('event_type', ContractSigningEventType::EMAIL_SENT)
            ->latestOfMany('occurred_at');
    }

    public static function findByToken(string $token): ?self
    {
        return static::whereHasValidToken($token)->whereNull('signed_at')->first();
    }

    public function isSigned(): bool
    {
        return $this->signed_at !== null;
    }
}
