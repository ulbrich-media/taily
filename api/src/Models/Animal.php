<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Builder;
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
use Taily\Enums\CustomFieldEntity;
use Taily\Models\Concerns\SearchesWithLike;
use Taily\Traits\HasCustomFields;

class Animal extends Model implements HasMedia
{
    use HasCustomFields, HasFactory, HasUuids, SearchesWithLike;

    /** @use InteractsWithMedia<Media> */
    use InteractsWithMedia;

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
        'publish_description' => '',
        'application_url' => '',
        'custom_fields' => '{}',
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
        'is_reserved',
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
            'custom_fields' => 'array',
            'date_of_birth' => 'date:Y-m-d',
            'intake_date' => 'date:Y-m-d',
            'date_of_death' => 'date:Y-m-d',
            'is_neutered' => 'boolean',
            'is_boarding_animal' => 'boolean',
            'do_publish' => 'boolean',
            'is_reserved' => 'boolean',
            'is_deceased' => 'boolean',
            'adoption_fee' => 'decimal:2',
            'monthly_boarding_cost' => 'decimal:2',
            'monthly_sponsorship' => 'decimal:2',
        ];
    }

    public function customFieldEntity(): CustomFieldEntity
    {
        return CustomFieldEntity::ANIMAL;
    }

    public function customFieldScope(): array
    {
        return [$this->animal_type_id, []];
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('pictures')->useDisk('animal-pictures');
    }

    /**
     * The animal's profile picture: the first image in the `pictures`
     * collection, in upload order. The collection can also hold videos,
     * which are skipped here.
     */
    public function getProfilePictureMedia(): ?Media
    {
        return $this->getMedia('pictures')
            ->sortBy('order_column')
            ->first(fn (Media $media) => str_starts_with($media->mime_type ?? '', 'image/'));
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

    public function traits(): HasMany
    {
        return $this->hasMany(AnimalTrait::class);
    }

    public function compatibilities(): HasMany
    {
        return $this->hasMany(AnimalTrait::class)->where('type', 'compatibility');
    }

    public function personalityTraits(): HasMany
    {
        return $this->hasMany(AnimalTrait::class)->where('type', 'personality_trait');
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

    /**
     * Apply the filters of the animal list. Unknown names are ignored here;
     * the list request rejects them before they get this far.
     *
     * @param  array<string, string|list<string>>  $filters
     */
    public function scopeFilterBy(Builder $query, array $filters): void
    {
        foreach ($filters as $name => $value) {
            if ($value === [] || $value === null || $value === '') {
                continue;
            }

            match ($name) {
                'animal_type_id' => $query->where('animals.animal_type_id', $value),
                'status' => $query->whereListStatus($value),
                'assigned_agent_id' => $value === 'none'
                    ? $query->whereNull('animals.assigned_agent_id')
                    : $query->where('animals.assigned_agent_id', $value),
                'published' => $query->where('animals.do_publish', (bool) $value),
                'neutered' => $query->where('animals.is_neutered', (bool) $value),
                'has_image' => $query->whereHasImage((bool) $value),
                'boarding' => $query->where('animals.is_boarding_animal', true),
                'reserved' => $query->where('animals.is_reserved', true),
                'has_sponsor' => $query->where(function (Builder $sponsor) {
                    $sponsor->whereNotNull('animals.sponsor_id')
                        ->orWhere(fn (Builder $external) => $external
                            ->whereNotNull('animals.sponsor_external')
                            ->where('animals.sponsor_external', '!=', ''));
                }),
                default => null,
            };
        }
    }

    /**
     * Status is derived from the adoptions, there is no column: `adopted` has
     * a done adoption, `in_progress` has a pending or in-progress one (and no
     * done one), `open` has neither. Canceled adoptions do not count.
     *
     * @param  list<string>  $statuses
     */
    public function scopeWhereListStatus(Builder $query, array $statuses): void
    {
        $adoption = fn (array $states) => function ($sub) use ($states) {
            $sub->selectRaw('1')
                ->from('adoptions')
                ->whereColumn('adoptions.animal_id', 'animals.id')
                ->whereIn('adoptions.status', $states);
        };

        $query->where(function (Builder $any) use ($statuses, $adoption) {
            foreach ($statuses as $status) {
                $any->orWhere(fn (Builder $one) => match ($status) {
                    'adopted' => $one->whereExists($adoption(['done'])),
                    'in_progress' => $one->whereNotExists($adoption(['done']))
                        ->whereExists($adoption(['pending', 'in_progress'])),
                    'open' => $one->whereNotExists($adoption(['done', 'pending', 'in_progress'])),
                    default => $one->whereRaw('1 = 0'),
                });
            }
        });
    }

    /**
     * At least one image in the `pictures` collection; videos do not count.
     */
    public function scopeWhereHasImage(Builder $query, bool $hasImage = true): void
    {
        $images = function ($sub) {
            $sub->selectRaw('1')
                ->from('media')
                ->where('media.model_type', (new self)->getMorphClass())
                ->whereColumn('media.model_id', 'animals.id')
                ->where('media.collection_name', 'pictures')
                ->where('media.mime_type', 'like', 'image/%');
        };

        $hasImage ? $query->whereExists($images) : $query->whereNotExists($images);
    }

    /**
     * Match the name, old name, animal number, chip ids, origin organization,
     * external sponsor or the full name of the owner or sponsor. Every word
     * has to match the person's first or last name, so "Anna Müller" and
     * "Müller Anna" find the same person.
     */
    public function scopeSearch(Builder $query, ?string $term): void
    {
        $term = trim((string) $term);

        if ($term === '') {
            return;
        }

        $words = preg_split('/\s+/u', $term, -1, PREG_SPLIT_NO_EMPTY);
        $person = function (Builder $person) use ($words) {
            foreach ($words as $word) {
                $person->where(function (Builder $name) use ($word) {
                    self::whereLike($name, 'people.first_name', $word);
                    self::whereLike($name, 'people.last_name', $word, 'or');
                });
            }
        };

        $query->where(function (Builder $search) use ($term, $person) {
            foreach (['name', 'old_name', 'animal_number', 'tasso_id', 'findefix_id', 'trace_id', 'origin_organization', 'sponsor_external'] as $column) {
                self::whereLike($search, "animals.{$column}", $term, 'or');
            }

            $search->orWhereHas('owner', $person)->orWhereHas('sponsor', $person);
        });
    }

    /**
     * Nulls in `date_of_birth` come last in both directions. Ties are broken
     * by id, so rows never repeat or vanish between pages.
     */
    public function scopeSortedBy(Builder $query, string $key, string $direction = 'desc'): void
    {
        if ($key === 'date_of_birth') {
            $query->orderByRaw('animals.date_of_birth is null');
        }

        $query->orderBy("animals.{$key}", $direction)->orderBy('animals.id');
    }
}
