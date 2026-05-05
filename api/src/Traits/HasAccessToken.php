<?php

namespace Taily\Traits;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\MorphMany;
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
        return $this->accessTokens()->create([
            'token' => Str::random(64),
            'expires_at' => $expiresAt,
        ]);
    }

    public function activeToken(): ?AccessToken
    {
        return $this->accessTokens()->where('expires_at', '>', now())->first();
    }

    public static function whereHasValidToken(string $token): Builder
    {
        return static::whereHas('accessTokens', fn (Builder $q) => $q
            ->where('token', $token)
            ->where('expires_at', '>', now())
        );
    }
}
