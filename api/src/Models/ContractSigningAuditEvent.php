<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Taily\Enums\ContractSigningEventType;

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
}
