<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Adoption extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $attributes = [
        'pre_inspection_summary' => '',
    ];

    protected $fillable = [
        'animal_id',
        'mediator_id',
        'applicant_id',
        'inspector_id',
        'pre_inspection_result',
        'pre_inspection_summary',
        'contract_sent_at',
        'contract_signed',
        'transfer_planned_at',
        'transferred_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'contract_sent_at' => 'date',
            'transfer_planned_at' => 'date',
            'transferred_at' => 'date',
            'contract_signed' => 'boolean',
        ];
    }

    /**
     * Get the animal being adopted.
     */
    public function animal(): BelongsTo
    {
        return $this->belongsTo(Animal::class);
    }

    /**
     * Get the mediator handling the adoption.
     */
    public function mediator(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'mediator_id');
    }

    /**
     * Get the applicant/adopter.
     */
    public function applicant(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'applicant_id');
    }

    /**
     * Get the inspector for pre-inspection.
     */
    public function inspector(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'inspector_id');
    }

    /**
     * Get pre-inspection stage status.
     */
    public function getPreInspectionStatusAttribute(): string
    {
        if ($this->pre_inspection_result === 'approved') {
            return 'finished';
        }
        if ($this->pre_inspection_result === 'rejected') {
            return 'finished';
        }
        if ($this->inspector_id !== null) {
            return 'in_progress';
        }

        return 'not_started';
    }

    /**
     * Get contract stage status.
     */
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

    /**
     * Get transfer stage status.
     */
    public function getTransferStatusAttribute(): string
    {
        if ($this->transferred_at !== null) {
            return 'finished';
        }
        if ($this->transfer_planned_at !== null) {
            return 'in_progress';
        }

        return 'not_started';
    }

    /**
     * Get the overall status of the adoption.
     */
    public function getOverallStatusAttribute(): string
    {
        if ($this->transferred_at !== null) {
            return 'completed';
        }
        if ($this->pre_inspection_result === 'rejected') {
            return 'rejected';
        }

        return 'in_progress';
    }
}
