<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class UserInvitation extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'token',
        'expires_at',
        'accepted_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'accepted_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function createForUser(User $user): self
    {
        $token = Str::random(64);

        return self::create([
            'user_id' => $user->id,
            'token' => $token,
            'expires_at' => now()->addDays(7),
        ]);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isAccepted(): bool
    {
        return $this->accepted_at !== null;
    }

    public function markAsAccepted(): void
    {
        $this->accepted_at = now();
        $this->save();
    }

    public static function findByToken(string $token): ?self
    {
        return self::where('token', $token)
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->first();
    }
}
