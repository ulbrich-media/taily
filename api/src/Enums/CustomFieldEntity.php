<?php

namespace Taily\Enums;

use Taily\Models\Animal;
use Taily\Models\Person;

/**
 * The entities that can carry custom fields, and the sections of their UI a
 * Field Group can be placed in (see docs/features/custom-fields.md).
 */
enum CustomFieldEntity: string
{
    case ANIMAL = 'animal';
    case PERSON = 'person';

    /** The section that is part of the entity's create form. */
    public const CREATE_SECTION = 'basic';

    /**
     * @return array<string, string> section => German label, in display order
     */
    public function sections(): array
    {
        return match ($this) {
            self::ANIMAL => ['basic' => 'Basis', 'extra' => 'Weitere Angaben'],
            self::PERSON => ['basic' => 'Basis & Kontakt'],
        };
    }

    /**
     * @return class-string<Animal|Person>
     */
    public function modelClass(): string
    {
        return match ($this) {
            self::ANIMAL => Animal::class,
            self::PERSON => Person::class,
        };
    }

    /** German plural used in confirmation messages ("bei 14 Tieren"). */
    public function pluralLabel(): string
    {
        return match ($this) {
            self::ANIMAL => 'Tieren',
            self::PERSON => 'Personen',
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
