<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * A portal session of an applicant, opened by a confirmation or login link.
 * The applicant's email is their identity; there is no account and no
 * "stay logged in" (docs/features/applicant-portal.md).
 */
class ApplicantSession extends Model
{
    use HasUuids;

    public const LIFETIME_HOURS = 2;

    protected $fillable = ['email', 'token', 'expires_at'];

    protected $hidden = ['token'];

    protected $casts = ['expires_at' => 'datetime'];

    /**
     * @return array{0: self, 1: string} the session and its plaintext token
     */
    public static function open(string $email): array
    {
        $token = Str::random(64);

        $session = self::create([
            'email' => Adoption::normalizeEmail($email),
            'token' => hash('sha256', $token),
            'expires_at' => now()->addHours(self::LIFETIME_HOURS),
        ]);

        return [$session, $token];
    }

    public static function findValid(?string $token): ?self
    {
        if ($token === null || $token === '') {
            return null;
        }

        return self::where('token', hash('sha256', $token))->where('expires_at', '>', now())->first();
    }
}
