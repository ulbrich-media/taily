<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Vaccination extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'title',
        'description',
        'animal_type_id',
    ];

    protected $attributes = [
        'description' => '',
    ];

    public function animalType(): BelongsTo
    {
        return $this->belongsTo(AnimalType::class);
    }

    public function animals(): BelongsToMany
    {
        return $this->belongsToMany(Animal::class, 'animal_vaccination')
            ->withPivot('vaccinated_at')
            ->withTimestamps();
    }
}
