<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * A single-use link emailed to an applicant: confirming an application, or
 * logging into the portal (docs/features/applicant-portal.md). Opening the
 * link doesn't use it up — only the click on the page's button does, so mail
 * scanners that open links can't consume it. Only the SHA-256 hash is stored.
 */
class ApplicantLink extends Model
{
    use HasUuids;

    public const PURPOSE_CONFIRM = 'confirm';

    public const PURPOSE_LOGIN = 'login';

    public const LIFETIME_HOURS = 4;

    protected $fillable = ['email', 'purpose', 'adoption_id', 'token', 'expires_at', 'used_at'];

    protected $hidden = ['token'];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
    ];

    public function adoption(): BelongsTo
    {
        return $this->belongsTo(Adoption::class);
    }

    /**
     * @return array{0: self, 1: string} the link and its plaintext token
     */
    public static function issue(string $purpose, string $email, ?Adoption $adoption = null): array
    {
        $token = Str::random(64);

        $link = self::create([
            'email' => Adoption::normalizeEmail($email),
            'purpose' => $purpose,
            'adoption_id' => $adoption?->id,
            'token' => hash('sha256', $token),
            'expires_at' => now()->addHours(self::LIFETIME_HOURS),
        ]);

        return [$link, $token];
    }

    public static function findUsable(string $purpose, string $token): ?self
    {
        return self::where('token', hash('sha256', $token))
            ->where('purpose', $purpose)
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->first();
    }
}
