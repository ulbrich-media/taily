<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Taily\Enums\TiervermittlungSpecies;

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
        'tiervermittlung_species',
    ];

    protected function casts(): array
    {
        return [
            'tiervermittlung_species' => TiervermittlungSpecies::class,
        ];
    }

    public function fieldGroups(): HasMany
    {
        return $this->hasMany(FieldGroup::class)->orderBy('position');
    }

    public function fieldDefinitions(): HasMany
    {
        return $this->hasMany(FieldDefinition::class);
    }

    public function contractTemplates(): HasMany
    {
        return $this->hasMany(ContractTemplate::class);
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
