<?php

namespace Taily\Traits;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;
use Taily\Models\AccessToken;

/**
 * Attaches a polymorphic access token to a model via the access_tokens table.
 *
 * Call issueToken() after the model is persisted.
 * In the model's findByToken(), use whereHasValidToken() as the base query
 * and add any model-specific "consumed" conditions on top.
 */
trait HasAccessToken
{
    public function accessTokens(): MorphMany
    {
        return $this->morphMany(AccessToken::class, 'tokenable');
    }

    public function issueToken(CarbonInterface $expiresAt): AccessToken
    {
        $token = Str::random(64);

        return $this->accessTokens()->create([
            'token_hash' => hash('sha256', $token),
            'token_ciphertext' => Crypt::encryptString($token),
            'expires_at' => $expiresAt,
        ]);
    }

    public function activeToken(): ?AccessToken
    {
        return $this->accessTokens()->where('expires_at', '>', now())->orderByDesc('expires_at')->first();
    }

    public static function whereHasValidToken(string $token): Builder
    {
        return static::whereHas('accessTokens', fn (Builder $q) => $q
            ->where('token_hash', hash('sha256', $token))
            ->where('expires_at', '>', now())
        );
    }
}
