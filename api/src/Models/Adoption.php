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
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Taily\Enums\AdoptionStep;
use Taily\Enums\ContractSigningStatus;
use Taily\Models\Concerns\SearchesWithLike;

class Adoption extends Model implements HasMedia
{
    use HasFactory, HasUuids, SearchesWithLike;

    /** @use InteractsWithMedia<Media> */
    use InteractsWithMedia;

    /**
     * The applicant's own data (ADR-018), without the `applicant_` prefix.
     * Built-in Case File fields name these in `applicant_attribute`; the
     * address parts together form the `address` field.
     */
    public const APPLICANT_ATTRIBUTES = ['first_name', 'last_name', 'email', 'phone', 'date_of_birth'];

    public const ADDRESS_PARTS = ['street_line', 'street_line_additional', 'postal_code', 'city', 'country_code'];

    protected $attributes = [
        'applicant_first_name' => '',
        'applicant_last_name' => '',
        'applicant_email' => '',
        'applicant_phone' => '',
        'applicant_street_line' => '',
        'applicant_street_line_additional' => '',
        'applicant_postal_code' => '',
        'applicant_city' => '',
        'applicant_country_code' => '',
        'notes' => '',
        'canceled_reason' => '',
        'pre_inspection_notes' => '',
    ];

    protected $fillable = [
        'animal_id',
        'mediator_id',
        'applicant_person_id',
        'applicant_first_name',
        'applicant_last_name',
        'applicant_email',
        'applicant_phone',
        'applicant_date_of_birth',
        'applicant_street_line',
        'applicant_street_line_additional',
        'applicant_postal_code',
        'applicant_city',
        'applicant_country_code',
        'status',
        'canceled_at',
        'canceled_reason',
        'notes',
        'pre_inspection_notes',
        'pre_inspection_confirmed_at',
        'pre_inspection_confirmed_by',
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
            'pre_inspection_confirmed_at' => 'datetime',
            'applicant_date_of_birth' => 'date',
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

    /**
     * A Person Taily already manages, referenced for orientation only — the
     * applicant's data is the adoption's own (ADR-018).
     */
    public function applicantPerson(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'applicant_person_id');
    }

    public function getApplicantFullNameAttribute(): string
    {
        return trim("{$this->applicant_first_name} {$this->applicant_last_name}");
    }

    /**
     * The applicant's email is what links their adoptions, so it is
     * compared in one form only.
     */
    public function setApplicantEmailAttribute(?string $value): void
    {
        $this->attributes['applicant_email'] = self::normalizeEmail($value);
    }

    public static function normalizeEmail(?string $email): string
    {
        return mb_strtolower(trim((string) $email));
    }

    /**
     * The applicant's data as copied from a Person when an adoption starts
     * from someone Taily already knows.
     *
     * @return array<string, mixed>
     */
    public static function applicantDataFrom(Person $person): array
    {
        $data = [];

        foreach ([...self::APPLICANT_ATTRIBUTES, ...self::ADDRESS_PARTS] as $attribute) {
            $data["applicant_{$attribute}"] = $person->{$attribute} ?? ($attribute === 'date_of_birth' ? null : '');
        }

        // An applicant has one phone number; a Person may only have a mobile one.
        if ($data['applicant_phone'] === '') {
            $data['applicant_phone'] = (string) $person->mobile;
        }

        return $data;
    }

    /**
     * Other adoptions of the same applicant: the same confirmed email or the
     * same referenced Person. An unconfirmed application's email may belong
     * to someone else, so it links nothing until it is confirmed.
     */
    public function scopeRelatedTo(Builder $query, Adoption $adoption): void
    {
        $query->whereKeyNot($adoption->id)->where(function (Builder $related) use ($adoption) {
            $related->whereRaw('1 = 0');

            if ($adoption->applicant_email !== '' && $adoption->status !== 'unconfirmed') {
                $related->orWhere(fn (Builder $sameEmail) => $sameEmail
                    ->where('applicant_email', $adoption->applicant_email)
                    ->where('status', '!=', 'unconfirmed'));
            }

            if ($adoption->applicant_person_id !== null) {
                $related->orWhere('applicant_person_id', $adoption->applicant_person_id);
            }
        });
    }

    /**
     * Adoptions of a Person as applicant: referenced, or with their email
     * once it is confirmed.
     */
    public function scopeOfApplicant(Builder $query, Person $person): void
    {
        $email = self::normalizeEmail($person->email);

        $query->where(function (Builder $of) use ($person, $email) {
            $of->where('applicant_person_id', $person->id);

            if ($email !== '') {
                $of->orWhere(fn (Builder $sameEmail) => $sameEmail
                    ->where('applicant_email', $email)
                    ->where('status', '!=', 'unconfirmed'));
            }
        });
    }

    public function transport(): BelongsTo
    {
        return $this->belongsTo(Transport::class);
    }

    public function preInspections(): HasMany
    {
        return $this->hasMany(PreInspection::class)->orderBy('created_at');
    }

    public function preInspectionConfirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pre_inspection_confirmed_by');
    }

    public function fieldValues(): HasMany
    {
        return $this->hasMany(AdoptionFieldValue::class);
    }

    public function requirements(): HasMany
    {
        return $this->hasMany(AdoptionRequirement::class);
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
                'applicant_person_id' => ($person = Person::find($value)) ? $query->ofApplicant($person) : $query->whereRaw('1 = 0'),
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
     * Match the full name of the applicant or the name or old name of the
     * animal. Every word has to match the applicant's first or last name, so
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
            $search
                ->whereHas('animal', function (Builder $animal) use ($term) {
                    self::whereLike($animal, 'animals.name', $term);
                    self::whereLike($animal, 'animals.old_name', $term, 'or');
                })
                ->orWhere(function (Builder $applicant) use ($words) {
                    foreach ($words as $word) {
                        $applicant->where(function (Builder $name) use ($word) {
                            self::whereLike($name, 'adoptions.applicant_first_name', $word);
                            self::whereLike($name, 'adoptions.applicant_last_name', $word, 'or');
                        });
                    }
                });
        });
    }

    /**
     * Mirrors getPreInspectionStatusAttribute().
     *
     * @param  list<string>  $statuses
     */
    public function scopeWherePreInspectionStatus(Builder $query, array $statuses): void
    {
        $started = function (Builder $q) {
            $q->whereHas('preInspections')
                ->orWhereHas('requirements', fn (Builder $requirement) => $requirement
                    ->where('waived', false)
                    ->where('required_for', AdoptionStep::PRE_INSPECTION->value));
        };

        self::whereAnyStatus($query, $statuses, fn (Builder $q, string $status) => match ($status) {
            'finished' => $q->whereNotNull('pre_inspection_confirmed_at'),
            'pending' => $q->whereNull('pre_inspection_confirmed_at')->where($started),
            'not_started' => $q->whereNull('pre_inspection_confirmed_at')->whereNot($started),
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
                ->orderBy('applicant_last_name', $direction)
                ->orderBy('applicant_first_name', $direction),
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

    /**
     * The mediator closes the step with a confirmation — with or without a
     * pre-inspection, and regardless of its verdict. Until then the step is
     * under way once a pre-inspection exists or a field (e.g. the home
     * video) was made required for it (docs/features/adoption.md#pre-inspection).
     */
    public function getPreInspectionStatusAttribute(): string
    {
        if ($this->pre_inspection_confirmed_at !== null) {
            return 'finished';
        }

        $hasInspections = $this->relationLoaded('preInspections')
            ? $this->preInspections->isNotEmpty()
            : $this->preInspections()->exists();

        $requested = $this->relationLoaded('requirements')
            ? $this->requirements->contains(fn (AdoptionRequirement $r) => ! $r->waived && $r->required_for === AdoptionStep::PRE_INSPECTION)
            : $this->requirements()->where('waived', false)->where('required_for', AdoptionStep::PRE_INSPECTION->value)->exists();

        return $hasInspections || $requested ? 'pending' : 'not_started';
    }
}
