<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class UserInvitation extends Model
{
    use HasUuids;

    /**
     * The plaintext token, only set on the instance createForUser() returns —
     * this is what belongs in the invitation mail. The database only ever
     * holds the SHA-256 hash, so a leaked copy cannot take over the pending
     * accounts.
     */
    public ?string $plainTextToken = null;

    protected $fillable = [
        'user_id',
        'token',
        'expires_at',
        'accepted_at',
    ];

    protected $hidden = [
        'token',
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

        $invitation = self::create([
            'user_id' => $user->id,
            'token' => hash('sha256', $token),
            'expires_at' => now()->addDays(7),
        ]);

        $invitation->plainTextToken = $token;

        return $invitation;
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
        return self::where('token', hash('sha256', $token))
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->first();
    }
}
