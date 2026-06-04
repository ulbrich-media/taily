<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transport extends Model
{
    use HasFactory, HasUuids;

    protected $attributes = [
        'name' => '',
        'notes' => '',
        'transporter' => '',
    ];

    protected $fillable = [
        'name',
        'notes',
        'planned_at',
        'responsible_id',
        'transporter',
    ];

    protected function casts(): array
    {
        return [
            'planned_at' => 'date',
            'done_at' => 'datetime',
        ];
    }

    public function isDone(): bool
    {
        return $this->done_at !== null;
    }

    public function responsible(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'responsible_id');
    }

    public function adoptions(): HasMany
    {
        return $this->hasMany(Adoption::class);
    }
}
