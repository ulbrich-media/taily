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
 *
 * Every contract also prints the fixed fields, ahead of the configured ones:
 * the parties' names, the adopter's email and address, and the animal's
 * photo when it has one. They are required — the photo excepted — and
 * can't be configured, removed or waived.
 */
class ContractTemplate extends Model
{
    use HasUuids;

    public const SECTIONS = ['animal', 'mediator', 'adopter'];

    /** @var array<string, list<array{key: string, required: bool}>> */
    public const FIXED_FIELDS = [
        'animal' => [
            ['key' => 'animal.name', 'required' => true],
            ['key' => 'animal.photo', 'required' => false],
        ],
        'mediator' => [
            ['key' => 'mediator.full_name', 'required' => true],
        ],
        'adopter' => [
            ['key' => 'first_name', 'required' => true],
            ['key' => 'last_name', 'required' => true],
            ['key' => 'email', 'required' => true],
            ['key' => 'address', 'required' => true],
        ],
    ];

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
     * The configured entries of one data section, without the fixed ones.
     *
     * @return list<array{key: string, required: bool}>
     */
    public function section(string $section): array
    {
        return array_values($this->{"{$section}_fields"} ?? []);
    }

    /**
     * What one data section prints: the fixed entries, then the configured.
     *
     * @return list<array{key: string, required: bool}>
     */
    public function printedSection(string $section): array
    {
        return [...self::FIXED_FIELDS[$section], ...$this->section($section)];
    }

    /**
     * Every key the template prints, required or not.
     *
     * @return list<string>
     */
    public function printedKeys(): array
    {
        return collect(self::SECTIONS)
            ->flatMap(fn (string $section) => array_column($this->printedSection($section), 'key'))
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
            ->flatMap(fn (string $section) => $this->printedSection($section))
            ->filter(fn (array $entry) => $entry['required'] ?? true)
            ->pluck('key')
            ->values()
            ->all();
    }

    public static function isFixed(string $key): bool
    {
        return collect(self::FIXED_FIELDS)->flatten(1)->contains('key', $key);
    }

    /**
     * The fixed keys every contract requires. A mediator can't waive them.
     *
     * @return list<string>
     */
    public static function fixedRequiredKeys(): array
    {
        return collect(self::FIXED_FIELDS)
            ->flatten(1)
            ->filter(fn (array $entry) => $entry['required'])
            ->pluck('key')
            ->values()
            ->all();
    }
}
