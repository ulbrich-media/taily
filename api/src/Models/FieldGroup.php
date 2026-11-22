<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A titled section of an animal type's Case File catalogue. Groups decide *where* a field
 * appears; the field's steps decide *when* (docs/features/case-file.md).
 */
class FieldGroup extends Model
{
    use HasUuids;

    protected $attributes = [
        'intro' => '',
    ];

    protected $fillable = [
        'animal_type_id',
        'title',
        'intro',
        'position',
    ];

    public function animalType(): BelongsTo
    {
        return $this->belongsTo(AnimalType::class);
    }

    public function fieldDefinitions(): HasMany
    {
        return $this->hasMany(FieldDefinition::class)->orderBy('position');
    }
}
