<?php

namespace Taily\Enums;

enum UserRole: string
{
    case USER = 'user';
    case ADMIN = 'admin';

    /**
     * Get all role values.
     *
     * @return array<string>
     */
    public static function values(): array
    {
        return array_map(fn (self $role) => $role->value, self::cases());
    }

    /**
     * Get role label for display.
     */
    public function label(): string
    {
        return match ($this) {
            self::USER => 'Benutzer',
            self::ADMIN => 'Administrator',
        };
    }
}
