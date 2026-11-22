<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A contract template (ADR-017): the printed title, the wording and three
 * data sections — animal, mediator, adopter — each an ordered list of
 * `{key, required}` entries. A template belongs to one animal type; its
 * required entries become requirements of the contract step for every
 * adoption of that type.
 */
class ContractTemplate extends Model
{
    use HasUuids;

    public const SECTIONS = ['animal', 'mediator', 'adopter'];

    protected $attributes = [
        'body' => '',
        'animal_fields' => '[]',
        'mediator_fields' => '[]',
        'adopter_fields' => '[]',
    ];

    protected $fillable = [
        'animal_type_id',
        'name',
        'title',
        'body',
        'animal_fields',
        'mediator_fields',
        'adopter_fields',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'animal_fields' => 'array',
            'mediator_fields' => 'array',
            'adopter_fields' => 'array',
            'archived_at' => 'datetime',
        ];
    }

    public function animalType(): BelongsTo
    {
        return $this->belongsTo(AnimalType::class);
    }

    public function scopeActive(Builder $query): void
    {
        $query->whereNull('archived_at');
    }

    public function scopeOfferedFor(Builder $query, ?string $animalTypeId): void
    {
        $query->active()->where('animal_type_id', $animalTypeId);
    }

    /**
     * The entries of one data section.
     *
     * @return list<array{key: string, required: bool}>
     */
    public function section(string $section): array
    {
        return array_values($this->{"{$section}_fields"} ?? []);
    }

    /**
     * Every key the template prints, required or not.
     *
     * @return list<string>
     */
    public function printedKeys(): array
    {
        return collect(self::SECTIONS)
            ->flatMap(fn (string $section) => array_column($this->section($section), 'key'))
            ->values()
            ->all();
    }

    /**
     * The keys that must be present before the contract can be generated.
     *
     * @return list<string>
     */
    public function requiredKeys(): array
    {
        return collect(self::SECTIONS)
            ->flatMap(fn (string $section) => $this->section($section))
            ->filter(fn (array $entry) => $entry['required'] ?? true)
            ->pluck('key')
            ->values()
            ->all();
    }
}
