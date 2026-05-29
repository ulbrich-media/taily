<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

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

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('contract')->singleFile()->useDisk('adoption-contract');
    }

    public function getContractStatusAttribute(): string
    {
        return $this->contract_signed ? 'finished' : 'not_started';
    }

    public function getTransportStatusAttribute(): string
    {
        if ($this->transport_id === null) {
            return 'not_started';
        }

        $transport = $this->relationLoaded('transport')
            ? $this->transport
            : $this->transport()->first();

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
            return 'pending';
        }

        if ($this->relationLoaded('preInspections')) {
            $inspections = $this->preInspections->where('animal_type_id', $animalTypeId);
        } else {
            $inspections = PreInspection::where('person_id', $this->applicant_id)
                ->where('animal_type_id', $animalTypeId)
                ->get();
        }

        if ($inspections->isEmpty()) {
            return 'pending';
        }

        if ($inspections->whereNull('submitted_at')->isNotEmpty()) {
            return 'in_progress';
        }

        return 'finished';
    }
}
