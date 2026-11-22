<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * The current value of one Field Definition for one adoption.
 */
class AdoptionFieldValue extends Model
{
    use HasUuids;

    public const REVIEW_PENDING = 'pending';

    public const REVIEW_CONFIRMED = 'confirmed';

    public const REVIEW_REJECTED = 'rejected';

    protected $attributes = [
        'review_note' => '',
    ];

    protected $fillable = [
        'adoption_id',
        'field_definition_id',
        'value',
        'review_status',
        'review_note',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'json',
            'reviewed_at' => 'datetime',
        ];
    }

    public function adoption(): BelongsTo
    {
        return $this->belongsTo(Adoption::class);
    }

    public function fieldDefinition(): BelongsTo
    {
        return $this->belongsTo(FieldDefinition::class);
    }
}
