<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Adoption extends Model
{
    use HasFactory, HasUuids;

    protected $attributes = [
        'canceled_reason' => '',
        'application_notes' => '',
        'pre_inspection_notes' => '',
    ];

    protected $fillable = [
        'animal_id',
        'mediator_id',
        'applicant_id',
        'status',
        'canceled_at',
        'canceled_reason',
        'application_notes',
        'pre_inspection_notes',
        'contract_sent_at',
        'contract_signed',
        'contract_signed_at',
        'transport_id',
        'handed_over_at',
    ];

    protected function casts(): array
    {
        return [
            'contract_sent_at' => 'date',
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

    public function getContractStatusAttribute(): string
    {
        if ($this->contract_signed) {
            return 'finished';
        }
        if ($this->contract_sent_at !== null) {
            return 'in_progress';
        }

        return 'not_started';
    }

    public function getTransportStatusAttribute(): string
    {
        if ($this->transport_id === null) {
            return 'not_started';
        }

        return 'in_progress';
    }

    public function getHandoverStatusAttribute(): string
    {
        return $this->handed_over_at !== null ? 'finished' : 'not_started';
    }
}
