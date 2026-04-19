<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class HealthCondition extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'animal_type_id',
    ];

    /**
     * Get the animal type this health condition is for.
     */
    public function animalType(): BelongsTo
    {
        return $this->belongsTo(AnimalType::class);
    }

    /**
     * Get the animals that have this health condition as a vaccination.
     */
    public function animalsVaccinated(): BelongsToMany
    {
        return $this->belongsToMany(Animal::class, 'animal_health_condition_vaccination')
            ->withPivot('vaccinated_at')
            ->withTimestamps();
    }

    /**
     * Get the animals that have this health condition as a test.
     */
    public function animalsTested(): BelongsToMany
    {
        return $this->belongsToMany(Animal::class, 'animal_health_condition_test')
            ->withPivot('tested_at', 'result')
            ->withTimestamps();
    }
}
