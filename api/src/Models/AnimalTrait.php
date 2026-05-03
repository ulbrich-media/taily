<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnimalTrait extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['animal_id', 'type', 'value'];

    public function animal(): BelongsTo
    {
        return $this->belongsTo(Animal::class);
    }
}
