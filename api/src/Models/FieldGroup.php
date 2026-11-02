<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A titled section of the Case File catalogue. Groups decide *where* a field
 * appears; the field's steps decide *when* (docs/features/case-file.md).
 */
class FieldGroup extends Model
{
    use HasUuids;

    protected $attributes = [
        'intro' => '',
    ];

    protected $fillable = [
        'title',
        'intro',
        'position',
    ];

    public function fieldDefinitions(): HasMany
    {
        return $this->hasMany(FieldDefinition::class)->orderBy('position');
    }
}
