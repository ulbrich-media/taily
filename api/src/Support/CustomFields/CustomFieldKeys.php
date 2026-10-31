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
     * The German error message for the first key of `$keys` already used by
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

            foreach (array_intersect($keys, $group->keys()) as $key) {
                return "Der Feldname `{$key}` wird bereits in der Gruppe ‚{$group->title}' verwendet.";
            }
        }

        return null;
    }
}
