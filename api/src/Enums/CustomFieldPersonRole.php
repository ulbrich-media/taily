<?php

namespace Taily\Enums;

/**
 * Roles a person Field Group can be scoped to. Every role is derived from
 * existing data rather than stored, see Person::customFieldRoles().
 */
enum CustomFieldPersonRole: string
{
    case ADOPTER = 'adopter';
    case MEDIATOR = 'mediator';
    case INSPECTOR = 'inspector';
    case FOSTER = 'foster';

    public function label(): string
    {
        return match ($this) {
            self::ADOPTER => 'Adoptant',
            self::MEDIATOR => 'Vermittler',
            self::INSPECTOR => 'Kontrolleur',
            self::FOSTER => 'Pflegestelle',
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
