<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transport extends Model
{
    use HasFactory, HasUuids;

    protected $attributes = [
        'notes' => '',
    ];

    protected $fillable = [
        'notes',
    ];

    public function adoptions(): HasMany
    {
        return $this->hasMany(Adoption::class);
    }
}
