<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PendingEmailChange extends Model
{
    use HasUuids;

    /**
     * The plaintext token, only set on the instance createForUser() returns —
     * this is what belongs in the confirmation mail. The database only ever
     * holds the SHA-256 hash, so a leaked copy cannot confirm the change.
     */
    public ?string $plainTextToken = null;

    protected $fillable = [
        'user_id',
        'new_email',
        'token',
        'expires_at',
    ];

    protected $hidden = [
        'token',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Create a pending change for the user, replacing any earlier one.
     */
    public static function createForUser(User $user, string $newEmail): self
    {
        $token = Str::random(64);
        $attributes = [
            'user_id' => $user->id,
            'new_email' => $newEmail,
            'token' => hash('sha256', $token),
            'expires_at' => now()->addMinutes(60),
        ];

        try {
            $pending = DB::transaction(function () use ($user, $attributes) {
                static::where('user_id', $user->id)->lockForUpdate()->delete();

                return self::create($attributes);
            });
        } catch (QueryException $e) {
            // Lost the race against a concurrent request for the same user
            // (e.g. a double-clicked submit); retry now that the other
            // transaction has committed its row for us to replace.
            static::where('user_id', $user->id)->delete();
            $pending = self::create($attributes);
        }

        $pending->plainTextToken = $token;

        return $pending;
    }

    public static function findByToken(string $token): ?self
    {
        return self::where('token', hash('sha256', $token))
            ->where('expires_at', '>', now())
            ->first();
    }
}
