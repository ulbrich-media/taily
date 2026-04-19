<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class AccessToken extends Model
{
    use HasUuids;

    const UPDATED_AT = null;

    protected $fillable = [
        'token',
        'expires_at',
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

    public static function findValid(string $token): ?self
    {
        return self::where('token', $token)
            ->where('expires_at', '>', now())
            ->first();
    }
}
