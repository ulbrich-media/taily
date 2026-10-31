<?php

namespace Taily\Support\CustomFields;

use Taily\Enums\CustomFieldEntity;
use Taily\Models\CustomFieldGroup;

/**
 * Keys are unique per entity: a key exists in at most one group.
 */
class CustomFieldKeys
{
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
