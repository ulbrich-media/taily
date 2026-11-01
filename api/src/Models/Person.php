<?php

namespace Taily\Models;

use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Taily\Enums\CustomFieldEntity;
use Taily\Enums\CustomFieldPersonRole;
use Taily\Models\Concerns\SearchesWithLike;
use Taily\Traits\HasCustomFields;

class Person extends Model implements HasMedia
{
    use HasCustomFields, HasFactory, HasUuids, SearchesWithLike;

    /** Role filter value => pivot table holding the animal types of that role. */
    private const ROLE_TABLES = [
        'inspector' => 'animal_type_person_inspector',
        'foster' => 'animal_type_person_foster',
        'mediator' => 'animal_type_person_mediator',
    ];

    /** @use InteractsWithMedia<Media> */
    use InteractsWithMedia;

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
        'custom_fields' => '{}',
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
            'custom_fields' => 'array',
            'date_of_birth' => 'date',
        ];
    }

    public function customFieldEntity(): CustomFieldEntity
    {
        return CustomFieldEntity::PERSON;
    }

    public function customFieldScope(): array
    {
        return [null, $this->customFieldRoles()];
    }

    /**
     * The roles custom field groups can be scoped to. All of them are
     * derived: `adopter` from being the applicant of any adoption, the others
     * from the per-animal-type role assignments.
     *
     * @return list<string>
     */
    public function customFieldRoles(): array
    {
        if (! $this->exists) {
            return [];
        }

        $has = fn (string $relation) => $this->relationLoaded($relation)
            ? $this->getRelation($relation)->isNotEmpty()
            : $this->{$relation}()->exists();

        return array_values(array_filter([
            $has('adoptionsAsApplicant') ? CustomFieldPersonRole::ADOPTER->value : null,
            $has('mediatorAnimalTypes') ? CustomFieldPersonRole::MEDIATOR->value : null,
            $has('inspectorAnimalTypes') ? CustomFieldPersonRole::INSPECTOR->value : null,
            $has('fosterAnimalTypes') ? CustomFieldPersonRole::FOSTER->value : null,
        ]));
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('pictures')->useDisk('person-pictures');
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

        // The list eager-loads the animal types, so no query per row is needed.
        $has = fn (string $relation) => $this->relationLoaded($relation)
            ? $this->getRelation($relation)->isNotEmpty()
            : $this->{$relation}()->exists();

        if ($has('inspectorAnimalTypes')) {
            $roles[] = 'Kontrolleur';
        }
        if ($has('fosterAnimalTypes')) {
            $roles[] = 'Pflegestelle';
        }
        if ($has('mediatorAnimalTypes')) {
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

    /**
     * Apply the filters of the people list. Unknown names are ignored here;
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
                'role' => $query->whereRole($value),
                'organization_id' => $value === 'none'
                    ? $query->whereNull('people.organization_id')
                    : $query->where('people.organization_id', $value),
                'has_adoptions' => $query->whereHasAdoptions((bool) $value),
                'has_pre_inspections' => $query->whereHasPreInspections((bool) $value),
                'adoption_status' => $query->whereAdoptionStatus($value),
                default => null,
            };
        }
    }

    /**
     * A person matches when any of the roles does: `none` (no role at all),
     * `mediator` (any animal type) or `mediator:<animal type id>`.
     *
     * @param  list<string>  $roles
     */
    public function scopeWhereRole(Builder $query, array $roles): void
    {
        $query->where(function (Builder $any) use ($roles) {
            foreach ($roles as $role) {
                if ($role === 'none') {
                    $any->orWhere(function (Builder $none) {
                        foreach (self::ROLE_TABLES as $table) {
                            $none->whereNotExists(self::roleAssignments($table));
                        }
                    });

                    continue;
                }

                [$name, $animalTypeId] = array_pad(explode(':', $role, 2), 2, null);

                if (array_key_exists($name, self::ROLE_TABLES) === false) {
                    $any->orWhereRaw('1 = 0');

                    continue;
                }

                $any->orWhereExists(self::roleAssignments(self::ROLE_TABLES[$name], $animalTypeId));
            }
        });
    }

    /**
     * As applicant of at least one adoption.
     */
    public function scopeWhereHasAdoptions(Builder $query, bool $has = true): void
    {
        $has ? $query->whereHas('adoptionsAsApplicant') : $query->whereDoesntHave('adoptionsAsApplicant');
    }

    public function scopeWhereHasPreInspections(Builder $query, bool $has = true): void
    {
        $inspections = fn ($sub) => $sub->selectRaw('1')
            ->from('pre_inspections')
            ->whereColumn('pre_inspections.person_id', 'people.id');

        $has ? $query->whereExists($inspections) : $query->whereNotExists($inspections);
    }

    /**
     * The person is applicant of an adoption in one of the states: `in_progress`
     * (pending and in progress), `done` or `canceled`.
     *
     * @param  list<string>  $statuses
     */
    public function scopeWhereAdoptionStatus(Builder $query, array $statuses): void
    {
        $states = [];
        foreach ($statuses as $status) {
            $states[] = $status;
            if ($status === 'in_progress') {
                $states[] = 'pending';
            }
        }

        $query->whereHas('adoptionsAsApplicant', fn (Builder $adoption) => $adoption->whereIn('adoptions.status', $states));
    }

    /**
     * Match the full name, email, role in the organization, city or country
     * code. Every word of the term has to match the first or last name, so
     * "Anna Müller" and "Müller Anna" find the same person.
     */
    public function scopeSearch(Builder $query, ?string $term): void
    {
        $term = trim((string) $term);

        if ($term === '') {
            return;
        }

        $words = preg_split('/\s+/u', $term, -1, PREG_SPLIT_NO_EMPTY);

        $query->where(function (Builder $search) use ($term, $words) {
            $search->where(function (Builder $name) use ($words) {
                foreach ($words as $word) {
                    $name->where(function (Builder $part) use ($word) {
                        self::whereLike($part, 'people.first_name', $word);
                        self::whereLike($part, 'people.last_name', $word, 'or');
                    });
                }
            });

            foreach (['email', 'organization_role', 'city', 'country_code'] as $column) {
                self::whereLike($search, "people.{$column}", $term, 'or');
            }
        });
    }

    /**
     * Sort keys: name (last, then first name), organization (name), city (zip,
     * then city name) and roles (number of role assignments). Ties are broken
     * by id, so rows never repeat or vanish between pages.
     */
    public function scopeSortedBy(Builder $query, string $key, string $direction = 'asc'): void
    {
        match ($key) {
            'name' => $query->orderBy('people.last_name', $direction)->orderBy('people.first_name', $direction),
            'organization' => $query->orderBy(
                Organization::query()->select('name')->whereColumn('organizations.id', 'people.organization_id'),
                $direction,
            ),
            'city' => $query->orderBy('people.postal_code', $direction)->orderBy('people.city', $direction),
            'roles' => $query->orderBy(
                DB::query()->selectRaw(implode(' + ', array_map(
                    fn (string $table) => "(select count(*) from {$table} where {$table}.person_id = people.id)",
                    self::ROLE_TABLES,
                ))),
                $direction,
            ),
            default => $query->orderBy("people.{$key}", $direction),
        };

        $query->orderBy('people.id');
    }

    private static function roleAssignments(string $table, ?string $animalTypeId = null): Closure
    {
        return function ($sub) use ($table, $animalTypeId) {
            $sub->selectRaw('1')
                ->from($table)
                ->whereColumn("{$table}.person_id", 'people.id')
                ->when($animalTypeId, fn ($q) => $q->where("{$table}.animal_type_id", $animalTypeId));
        };
    }
}
