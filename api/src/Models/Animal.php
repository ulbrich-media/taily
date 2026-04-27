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

class Animal extends Model implements HasMedia
{
    use HasFactory, HasUuids, InteractsWithMedia;

    protected $hidden = ['media'];

    protected $attributes = [
        'animal_number' => '',
        'old_name' => '',
        'breed' => '',
        'color' => '',
        'origin_country' => '',
        'character_description' => '',
        'contract_notes' => '',
        'internal_notes' => '',
        'health_description' => '',
        'tasso_id' => '',
        'findefix_id' => '',
        'trace_id' => '',
        'origin_organization' => '',
        'sponsor_external' => '',
        'current_location' => '',
        'alternate_transport_trace' => '',
        'alternate_arrival_location' => '',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        // Tab 1: Basic & Description
        'animal_type_id',
        'animal_number',
        'name',
        'old_name',
        'breed',
        'gender',
        'color',
        'weight_grams',
        'size_cm',
        'date_of_birth',
        'origin_country',
        'is_boarding_animal',
        'intake_date',
        'character_description',
        'contract_notes',
        'internal_notes',
        // Tab 2: Health & Identification
        'is_neutered',
        'health_description',
        'tasso_id',
        'findefix_id',
        'trace_id',
        // Tab 3: Placement, Contract & Costs
        'assigned_agent_id',
        'origin_organization',
        'owner_id',
        'adoption_fee',
        'monthly_boarding_cost',
        'monthly_sponsorship',
        'sponsor_id',
        'sponsor_external',
        // Tab 4: Organization, Marketing & Status
        'current_location',
        'alternate_transport_trace',
        'alternate_arrival_location',
        'do_publish',
        'publish_description',
        'application_url',
        'is_deceased',
        'date_of_death',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date:Y-m-d',
            'intake_date' => 'date:Y-m-d',
            'date_of_death' => 'date:Y-m-d',
            'is_neutered' => 'boolean',
            'is_boarding_animal' => 'boolean',
            'do_publish' => 'boolean',
            'is_deceased' => 'boolean',
            'adoption_fee' => 'decimal:2',
            'monthly_boarding_cost' => 'decimal:2',
            'monthly_sponsorship' => 'decimal:2',
        ];
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('pictures')->useDisk('local');
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        if ($media !== null && str_starts_with($media->mime_type ?? '', 'video/')) {
            return;
        }

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
     * Get the animal type for this animal.
     */
    public function animalType(): BelongsTo
    {
        return $this->belongsTo(AnimalType::class);
    }

    public function vaccinations(): BelongsToMany
    {
        return $this->belongsToMany(Vaccination::class, 'animal_vaccination')
            ->withPivot('vaccinated_at')
            ->withTimestamps();
    }

    public function medicalTests(): BelongsToMany
    {
        return $this->belongsToMany(MedicalTest::class, 'animal_medical_test')
            ->withPivot('tested_at', 'result')
            ->withTimestamps();
    }

    /**
     * Get the adoptions for this animal.
     */
    public function adoptions(): HasMany
    {
        return $this->hasMany(Adoption::class);
    }

    /**
     * Get the assigned agent (person) for this animal.
     */
    public function assignedAgent(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'assigned_agent_id');
    }

    /**
     * Get the owner for this animal.
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'owner_id');
    }

    /**
     * Get the sponsor for this animal.
     */
    public function sponsor(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'sponsor_id');
    }
}
