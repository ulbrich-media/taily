<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Taily\Enums\AdoptionStep;
use Taily\Support\CaseFile\Override;

/**
 * A mediator's per-adoption Requirement Override: require a field, waive it
 * or move its due step (docs/features/case-file.md#requirement-overrides).
 */
class AdoptionRequirement extends Model
{
    use HasUuids;

    protected $fillable = [
        'adoption_id',
        'field_definition_id',
        'required_for',
        'waived',
    ];

    protected function casts(): array
    {
        return [
            'required_for' => AdoptionStep::class,
            'waived' => 'boolean',
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

    public function toOverride(): Override
    {
        return new Override($this->required_for, $this->waived);
    }
}
