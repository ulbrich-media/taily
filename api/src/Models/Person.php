<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Person extends Model implements HasMedia
{
    use HasFactory, HasUuids, InteractsWithMedia;

    protected $hidden = ['media'];

    protected $attributes = [
        'email' => '',
        'street_line' => '',
        'street_line_additional' => '',
        'postal_code' => '',
        'city' => '',
        'country_code' => '',
        'phone' => '',
        'mobile' => '',
        'organization_role' => '',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'organization_id',
        'organization_role',
        'email',
        'street_line',
        'street_line_additional',
        'postal_code',
        'city',
        'country_code',
        'phone',
        'mobile',
        'date_of_birth',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
        ];
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('pictures')->useDisk('local');
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumbnail')
            ->fit(Fit::Crop, 80, 80)
            ->performOnCollections('pictures')
            ->nonQueued();

        $this->addMediaConversion('preview')
            ->fit(Fit::Max, 800, 800)
            ->performOnCollections('pictures')
            ->nonQueued();

        $this->addMediaConversion('full')
            ->fit(Fit::Max, 1440, 1440)
            ->performOnCollections('pictures')
            ->nonQueued();
    }

    /**
     * Get the person's full name.
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    /**
     * Get the person's roles as an array.
     */
    public function getRolesAttribute(): array
    {
        $roles = [];

        if ($this->inspectorAnimalTypes()->count() > 0) {
            $roles[] = 'Kontrolleur';
        }
        if ($this->fosterAnimalTypes()->count() > 0) {
            $roles[] = 'Pflegestelle';
        }
        if ($this->mediatorAnimalTypes()->count() > 0) {
            $roles[] = 'Vermittler';
        }

        return $roles;
    }

    /**
     * Get the organization this person belongs to.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Get the animal types this person is an inspector for.
     */
    public function inspectorAnimalTypes(): BelongsToMany
    {
        return $this->belongsToMany(AnimalType::class, 'animal_type_person_inspector')
            ->withTimestamps();
    }

    /**
     * Get the animal types this person is a mediator for.
     */
    public function mediatorAnimalTypes(): BelongsToMany
    {
        return $this->belongsToMany(AnimalType::class, 'animal_type_person_mediator')
            ->withTimestamps();
    }

    /**
     * Get the animal types this person is a foster for.
     */
    public function fosterAnimalTypes(): BelongsToMany
    {
        return $this->belongsToMany(AnimalType::class, 'animal_type_person_foster')
            ->withTimestamps();
    }

    /**
     * Get adoptions where this person is the mediator.
     */
    public function adoptionsAsMediator(): HasMany
    {
        return $this->hasMany(Adoption::class, 'mediator_id');
    }

    /**
     * Get adoptions where this person is the applicant.
     */
    public function adoptionsAsApplicant(): HasMany
    {
        return $this->hasMany(Adoption::class, 'applicant_id');
    }

}
