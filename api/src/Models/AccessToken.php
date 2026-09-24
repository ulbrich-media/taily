<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Crypt;

class AccessToken extends Model
{
    use HasUuids;

    const UPDATED_AT = null;

    protected $fillable = [
        'token_hash',
        'token_ciphertext',
        'expires_at',
    ];

    protected $hidden = [
        'token_hash',
        'token_ciphertext',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function tokenable(): MorphTo
    {
        return $this->morphTo();
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * The plaintext token, recovered from token_ciphertext on demand. Needed
     * well after issuance by ProcessContractSigningReminders and the
     * pre-inspection "copy link" action, so it can't be a one-way hash.
     */
    public function getTokenAttribute(): string
    {
        return Crypt::decryptString($this->token_ciphertext);
    }
}
