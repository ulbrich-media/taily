<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Taily\Traits\HasAccessToken;

/**
 * A pre-inspection of the applicant's home for one adoption
 * (docs/features/pre-inspection.md). The verdict is the inspector's
 * recommendation; the mediator closes the step on the adoption.
 */
class PreInspection extends Model
{
    use HasAccessToken, HasUuids;

    protected $attributes = [
        'memo' => '',
    ];

    protected $fillable = [
        'adoption_id',
        'memo',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
        ];
    }

    public function adoption(): BelongsTo
    {
        return $this->belongsTo(Adoption::class);
    }

    public function inspector(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'inspector_id');
    }

    /** Adoption statuses in which the inspector's link stops working. */
    public const CLOSED_ADOPTION_STATUSES = ['canceled', 'done'];

    public static function findByToken(string $token): ?self
    {
        return static::openByToken($token)->first();
    }

    /**
     * The pre-inspection an inspector's link opens: valid, not submitted yet,
     * and its adoption still running. A canceled or finished adoption
     * closes the link, so the applicant's data isn't shown any longer.
     *
     * @return Builder<self>
     */
    public static function openByToken(string $token): Builder
    {
        return static::whereHasValidToken($token)
            ->whereNull('submitted_at')
            ->whereHas('adoption', fn (Builder $adoption) => $adoption->whereNotIn('status', self::CLOSED_ADOPTION_STATUSES));
    }

    public function isSubmitted(): bool
    {
        return $this->submitted_at !== null;
    }

    public function getStatusAttribute(): string
    {
        return $this->submitted_at !== null ? (string) $this->verdict : 'pending';
    }
}
