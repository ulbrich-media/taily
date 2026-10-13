<?php

namespace Taily\Models;

use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Taily\Enums\ContractSigningStatus;

class Adoption extends Model implements HasMedia
{
    use HasFactory, HasUuids, InteractsWithMedia;

    protected $attributes = [
        'notes' => '',
        'canceled_reason' => '',
        'pre_inspection_notes' => '',
    ];

    protected $fillable = [
        'animal_id',
        'mediator_id',
        'applicant_id',
        'status',
        'canceled_at',
        'canceled_reason',
        'notes',
        'pre_inspection_notes',
        'contract_signed',
        'contract_signed_at',
        'transport_id',
        'handed_over_at',
    ];

    protected function casts(): array
    {
        return [
            'contract_signed' => 'boolean',
            'contract_signed_at' => 'datetime',
            'canceled_at' => 'datetime',
            'handed_over_at' => 'datetime',
        ];
    }

    public function animal(): BelongsTo
    {
        return $this->belongsTo(Animal::class);
    }

    public function mediator(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'mediator_id');
    }

    public function applicant(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'applicant_id');
    }

    public function transport(): BelongsTo
    {
        return $this->belongsTo(Transport::class);
    }

    // All pre-inspections for this adoption's applicant, keyed on person_id.
    // Filter by animal_type_id in application code (see getPreInspectionStatusAttribute).
    public function preInspections(): HasMany
    {
        return $this->hasMany(PreInspection::class, 'person_id', 'applicant_id');
    }

    public function contractSigningProcesses(): HasMany
    {
        return $this->hasMany(ContractSigningProcess::class);
    }

    public function latestContractSigningProcess(): HasOne
    {
        return $this->hasOne(ContractSigningProcess::class)->latestOfMany('created_at');
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('contract')->singleFile()->useDisk('adoption-contract');
    }

    /**
     * Apply the filters of the adoption list. Unknown names are ignored here;
     * the list request rejects them before they get this far.
     *
     * @param  array<string, string|list<string>>  $filters
     */
    public function scopeFilterBy(Builder $query, array $filters): void
    {
        foreach ($filters as $name => $value) {
            if ($value === [] || $value === null) {
                continue;
            }

            match ($name) {
                'status' => $query->whereIn('status', $value),
                'mediator_id' => $value === 'none'
                    ? $query->whereNull('mediator_id')
                    : $query->where('mediator_id', $value),
                'animal_id' => $query->where('animal_id', $value),
                'applicant_id' => $query->where('applicant_id', $value),
                'animal_type_id' => $query->whereHas('animal', fn (Builder $animal) => $animal->where('animal_type_id', $value)),
                'pre_inspection_status' => $query->wherePreInspectionStatus($value),
                'contract_status' => $query->whereContractStatus($value),
                'transport_status' => $query->whereTransportStatus($value),
                'handover_status' => $query->whereHandoverStatus($value),
                default => null,
            };
        }
    }

    /**
     * Match the full name of the applicant or the name of the animal. Every
     * word has to match the applicant's first or last name, so "Anna Müller"
     * and "Müller Anna" find the same person.
     */
    public function scopeSearch(Builder $query, ?string $term): void
    {
        $term = trim((string) $term);

        if ($term === '') {
            return;
        }

        $words = preg_split('/\s+/u', $term, -1, PREG_SPLIT_NO_EMPTY);

        $query->where(function (Builder $search) use ($term, $words) {
            $search
                ->whereHas('animal', fn (Builder $animal) => self::whereLike($animal, 'animals.name', $term))
                ->orWhereHas('applicant', function (Builder $applicant) use ($words) {
                    foreach ($words as $word) {
                        $applicant->where(function (Builder $name) use ($word) {
                            self::whereLike($name, 'people.first_name', $word);
                            self::whereLike($name, 'people.last_name', $word, 'or');
                        });
                    }
                });
        });
    }

    /**
     * Mirrors getPreInspectionStatusAttribute(): the pre-inspections of the
     * applicant for the animal's animal type decide the status.
     *
     * @param  list<string>  $statuses
     */
    public function scopeWherePreInspectionStatus(Builder $query, array $statuses): void
    {
        $inspections = fn (bool $unsubmittedOnly): Closure => function ($sub) use ($unsubmittedOnly) {
            $sub->selectRaw('1')
                ->from('pre_inspections')
                ->join('animals', 'animals.animal_type_id', '=', 'pre_inspections.animal_type_id')
                ->whereColumn('animals.id', 'adoptions.animal_id')
                ->whereColumn('pre_inspections.person_id', 'adoptions.applicant_id')
                ->when($unsubmittedOnly, fn ($q) => $q->whereNull('pre_inspections.submitted_at'));
        };

        self::whereAnyStatus($query, $statuses, fn (Builder $q, string $status) => match ($status) {
            'not_started' => $q->whereNotExists($inspections(false)),
            'pending' => $q->whereExists($inspections(true)),
            'finished' => $q->whereExists($inspections(false))->whereNotExists($inspections(true)),
        });
    }

    /**
     * Mirrors getContractStatusAttribute().
     *
     * @param  list<string>  $statuses
     */
    public function scopeWhereContractStatus(Builder $query, array $statuses): void
    {
        $active = array_map(fn (ContractSigningStatus $status) => $status->value, ContractSigningStatus::activeStatuses());
        $hasActiveProcess = fn (Builder $process) => $process->whereIn('status', $active);

        self::whereAnyStatus($query, $statuses, fn (Builder $q, string $status) => match ($status) {
            'finished' => $q->where('contract_signed', true),
            'pending' => $q->where('contract_signed', false)
                ->whereHas('latestContractSigningProcess', $hasActiveProcess),
            'not_started' => $q->where('contract_signed', false)
                ->whereDoesntHave('latestContractSigningProcess', $hasActiveProcess),
        });
    }

    /**
     * Mirrors getTransportStatusAttribute().
     *
     * @param  list<string>  $statuses
     */
    public function scopeWhereTransportStatus(Builder $query, array $statuses): void
    {
        $isDone = fn (Builder $transport) => $transport->whereNotNull('done_at');

        self::whereAnyStatus($query, $statuses, fn (Builder $q, string $status) => match ($status) {
            'not_started' => $q->whereNull('transport_id'),
            'pending' => $q->whereNotNull('transport_id')->whereDoesntHave('transport', $isDone),
            'finished' => $q->whereHas('transport', $isDone),
        });
    }

    /**
     * Mirrors getHandoverStatusAttribute().
     *
     * @param  list<string>  $statuses
     */
    public function scopeWhereHandoverStatus(Builder $query, array $statuses): void
    {
        self::whereAnyStatus($query, $statuses, fn (Builder $q, string $status) => match ($status) {
            'not_started' => $q->whereNull('handed_over_at'),
            'finished' => $q->whereNotNull('handed_over_at'),
        });
    }

    /**
     * Sorting by a related name uses a correlated subquery instead of a join,
     * so the query keeps selecting only adoption columns and counts stay exact.
     */
    public function scopeSortedBy(Builder $query, string $key, string $direction = 'desc'): void
    {
        $person = fn (string $foreignKey, string $column) => Person::query()
            ->select($column)
            ->whereColumn('people.id', "adoptions.{$foreignKey}");

        match ($key) {
            'animal_name' => $query->orderBy(
                Animal::query()->select('name')->whereColumn('animals.id', 'adoptions.animal_id'),
                $direction,
            ),
            'applicant_name' => $query
                ->orderBy($person('applicant_id', 'last_name'), $direction)
                ->orderBy($person('applicant_id', 'first_name'), $direction),
            'mediator_name' => $query
                ->orderBy($person('mediator_id', 'last_name'), $direction)
                ->orderBy($person('mediator_id', 'first_name'), $direction),
            default => $query->orderBy($key, $direction),
        };

        // Deterministic order, so rows never repeat or vanish between pages.
        $query->orderBy('adoptions.id');
    }

    /**
     * OR the statuses of one step together; a status is one condition each.
     *
     * @param  list<string>  $statuses
     * @param  Closure(Builder, string): mixed  $condition
     */
    private static function whereAnyStatus(Builder $query, array $statuses, Closure $condition): void
    {
        $query->where(function (Builder $any) use ($statuses, $condition) {
            foreach ($statuses as $status) {
                $any->orWhere(fn (Builder $one) => $condition($one, $status));
            }
        });
    }

    /**
     * Case-insensitive contains match; LIKE wildcards in the term are escaped.
     */
    private static function whereLike(Builder $query, string $column, string $term, string $boolean = 'and'): void
    {
        $pattern = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $term).'%';
        $column = $query->getQuery()->getGrammar()->wrap($column);

        $query->whereRaw("{$column} like ? escape ?", [$pattern, '!'], $boolean);
    }

    public function getContractStatusAttribute(): string
    {
        if ($this->contract_signed) {
            return 'finished';
        }

        $signingProcess = $this->getRelationValue('latestContractSigningProcess');

        if ($signingProcess?->status->isActive()) {
            return 'pending';
        }

        return 'not_started';
    }

    /**
     * How the signed contract came to be: 'digital' when the native signing
     * flow completed, 'manual' when it was confirmed by hand, null while
     * there is no signed contract.
     */
    public function getContractSourceAttribute(): ?string
    {
        if ($this->getRelationValue('latestContractSigningProcess')?->status === ContractSigningStatus::COMPLETED) {
            return 'digital';
        }

        return $this->contract_signed ? 'manual' : null;
    }

    public function getTransportStatusAttribute(): string
    {
        if ($this->transport_id === null) {
            return 'not_started';
        }

        $transport = $this->getRelationValue('transport');

        if ($transport?->isDone()) {
            return 'finished';
        }

        return 'pending';
    }

    public function getHandoverStatusAttribute(): string
    {
        return $this->handed_over_at !== null ? 'finished' : 'not_started';
    }

    public function getPreInspectionStatusAttribute(): string
    {
        $animalTypeId = $this->animal?->animal_type_id;

        if (! $animalTypeId) {
            return 'not_started';
        }

        if ($this->relationLoaded('preInspections')) {
            $inspections = $this->preInspections->where('animal_type_id', $animalTypeId);
        } else {
            $inspections = PreInspection::where('person_id', $this->applicant_id)
                ->where('animal_type_id', $animalTypeId)
                ->get();
        }

        if ($inspections->isEmpty()) {
            return 'not_started';
        }

        if ($inspections->whereNull('submitted_at')->isNotEmpty()) {
            return 'pending';
        }

        return 'finished';
    }
}
