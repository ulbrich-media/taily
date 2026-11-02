<?php

namespace Taily\Models;

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

    public static function findByToken(string $token): ?self
    {
        return static::whereHasValidToken($token)->whereNull('submitted_at')->first();
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
