<?php

namespace Taily\Support\CaseFile;

use Taily\Enums\AdoptionStep;
use Taily\Enums\FieldType;

/**
 * What the checklist needs to know about one field, independent of where the
 * field comes from: a Field Definition of the catalogue, or a built-in animal
 * or mediator field a contract template prints (`animal.*`, `mediator.*`).
 */
final readonly class FieldSpec
{
    /**
     * @param  list<string>  $animalTypeIds  empty means the field applies to every animal type
     * @param  array{field: string, equals?: mixed, in?: list<mixed>}|null  $condition
     */
    public function __construct(
        public string $key,
        public string $label,
        public FieldType $type,
        public AdoptionStep $collectAt,
        public ?AdoptionStep $requiredFor = null,
        public bool $requiresReview = false,
        public array $animalTypeIds = [],
        public ?array $condition = null,
    ) {}
}
