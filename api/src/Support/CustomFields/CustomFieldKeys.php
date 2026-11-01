<?php

namespace Taily\Support\CustomFields;

use Taily\Enums\CustomFieldEntity;
use Taily\Models\CustomFieldGroup;

/**
 * Keys are unique per entity: a key exists in at most one group. They are
 * also used as JSON paths in queries, so they must follow the builder's key
 * format.
 */
class CustomFieldKeys
{
    /** The form builder's key format, see EditFieldDialog in the frontend. */
    public const PATTERN = '/^[a-z][a-z0-9_]*$/';

    /**
     * The query path of a key's value in the `custom_fields` column.
     *
     * @psalm-taint-escape sql
     *
     * @throws \InvalidArgumentException for a key outside the key format
     */
    public static function jsonPath(string $key): string
    {
        if (! preg_match(self::PATTERN, $key)) {
            throw new \InvalidArgumentException("Invalid custom field key: {$key}");
        }

        return "custom_fields->{$key}";
    }

    /**
     * The German error message naming the keys of `$keys` outside the key
     * format, or null when all are valid.
     *
     * @param  list<string>  $keys
     */
    public function invalid(array $keys): ?string
    {
        $invalid = array_values(array_filter($keys, fn ($key) => ! preg_match(self::PATTERN, $key)));

        if ($invalid === []) {
            return null;
        }

        $names = implode(', ', array_map(fn ($key) => "`{$key}`", $invalid));

        return (count($invalid) === 1 ? "Der Feldname {$names} ist" : "Die Feldnamen {$names} sind")
            .' als Zusatzfeld nicht erlaubt. Erlaubt sind Kleinbuchstaben, Ziffern und Unterstriche, beginnend mit einem Buchstaben.';
    }

    public function __construct(private CustomFieldDefinitions $definitions) {}

    /**
     * The German error message naming the keys of `$keys` already used by
     * another group of the entity, or null when there is none.
     *
     * @param  list<string>  $keys
     */
    public function conflict(CustomFieldEntity $entity, array $keys, ?string $ignoreGroupId = null): ?string
    {
        foreach ($this->definitions->groups($entity) as $group) {
            /** @var CustomFieldGroup $group */
            if ($group->id === $ignoreGroupId) {
                continue;
            }

            $taken = array_values(array_intersect($keys, $group->keys()));

            if ($taken !== []) {
                $names = implode(', ', array_map(fn ($key) => "`{$key}`", $taken));

                return count($taken) === 1
                    ? "Der Feldname {$names} wird bereits in der Gruppe „{$group->title}“ verwendet."
                    : "Die Feldnamen {$names} werden bereits in der Gruppe „{$group->title}“ verwendet.";
            }
        }

        return null;
    }
}
