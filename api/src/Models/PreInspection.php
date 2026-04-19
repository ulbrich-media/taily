<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Taily\Traits\HasAccessToken;

class PreInspection extends Model
{
    use HasAccessToken, HasUuids;

    protected $attributes = [
        'notes' => '',
    ];

    protected $fillable = [
        'person_id',
        'animal_type_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
        ];
    }

    public function person(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'person_id');
    }

    public function animalType(): BelongsTo
    {
        return $this->belongsTo(AnimalType::class);
    }

    public function inspector(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'inspector_id');
    }

    public static function findByToken(string $token): ?self
    {
        return static::whereHasValidToken($token)->where('verdict', 'pending')->first();
    }

    public function isSubmitted(): bool
    {
        return $this->submitted_at !== null;
    }

    public function markAsSubmitted(): void
    {
        $this->submitted_at = now();
        $this->save();
    }

    public function getStatusAttribute(): string
    {
        if ($this->submitted_at !== null) {
            return $this->verdict;
        }

        return 'pending';
    }
}
