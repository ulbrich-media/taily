<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AnimalType extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'form_template_id',
    ];

    /**
     * Get the form template assigned to this animal type.
     */
    public function formTemplate(): BelongsTo
    {
        return $this->belongsTo(FormTemplate::class);
    }

    /**
     * Get the pre-inspections for this animal type.
     */
    public function preInspections(): HasMany
    {
        return $this->hasMany(PreInspection::class);
    }

    public function vaccinations(): HasMany
    {
        return $this->hasMany(Vaccination::class);
    }

    public function medicalTests(): HasMany
    {
        return $this->hasMany(MedicalTest::class);
    }

    /**
     * Get the animals for this animal type.
     */
    public function animals(): HasMany
    {
        return $this->hasMany(Animal::class);
    }

    /**
     * Get the people who are inspectors for this animal type.
     */
    public function inspectors(): BelongsToMany
    {
        return $this->belongsToMany(Person::class, 'animal_type_person_inspector')
            ->withTimestamps();
    }

    /**
     * Get the people who are mediators for this animal type.
     */
    public function mediators(): BelongsToMany
    {
        return $this->belongsToMany(Person::class, 'animal_type_person_mediator')
            ->withTimestamps();
    }

    /**
     * Get the people who are fosters for this animal type.
     */
    public function fosters(): BelongsToMany
    {
        return $this->belongsToMany(Person::class, 'animal_type_person_foster')
            ->withTimestamps();
    }
}
