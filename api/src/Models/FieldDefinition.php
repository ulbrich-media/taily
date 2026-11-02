<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Taily\Enums\AdoptionStep;
use Taily\Enums\FieldType;
use Taily\Support\CaseFile\FieldSpec;

/**
 * One field of the Case File catalogue. Built-in fields carry a
 * `person_attribute`: their value lives on the applicant's Person instead of
 * in an AdoptionFieldValue.
 */
class FieldDefinition extends Model
{
    use HasUuids;

    protected $attributes = [
        'help' => '',
    ];

    protected $fillable = [
        'key',
        'field_group_id',
        'position',
        'type',
        'label',
        'help',
        'options',
        'person_attribute',
        'collect_at',
        'required_for',
        'requires_review',
        'visible_to_applicant',
        'visible_to_inspector',
        'condition',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => FieldType::class,
            'collect_at' => AdoptionStep::class,
            'required_for' => AdoptionStep::class,
            'options' => 'array',
            'condition' => 'array',
            'requires_review' => 'boolean',
            'visible_to_applicant' => 'boolean',
            'visible_to_inspector' => 'boolean',
            'archived_at' => 'datetime',
        ];
    }

    public function fieldGroup(): BelongsTo
    {
        return $this->belongsTo(FieldGroup::class);
    }

    public function animalTypes(): BelongsToMany
    {
        return $this->belongsToMany(AnimalType::class);
    }

    public function scopeActive(Builder $query): void
    {
        $query->whereNull('archived_at');
    }

    public function isBuiltIn(): bool
    {
        return $this->person_attribute !== null;
    }

    /**
     * The choices of a select or radio field, as value => label.
     *
     * @return array<string, string>
     */
    public function choices(): array
    {
        $choices = [];

        foreach ($this->options['choices'] ?? [] as $choice) {
            $choices[(string) $choice['value']] = (string) $choice['label'];
        }

        return $choices;
    }

    public function toSpec(): FieldSpec
    {
        return new FieldSpec(
            key: $this->key,
            label: $this->label,
            type: $this->type,
            collectAt: $this->collect_at,
            requiredFor: $this->required_for,
            requiresReview: $this->requires_review,
            animalTypeIds: $this->animalTypes->pluck('id')->all(),
            condition: $this->condition,
        );
    }
}
