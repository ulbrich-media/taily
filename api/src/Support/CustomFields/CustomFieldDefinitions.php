<?php

namespace Taily\Support\CustomFields;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Taily\Enums\CustomFieldEntity;
use Taily\Models\CustomFieldGroup;
use Taily\Traits\HasCustomFields;

/**
 * The Field Groups of each entity, loaded once per request and memoized, so
 * serializing many records (lists, the Public API) costs no extra queries.
 * There are only a handful of groups per entity, so scope resolution happens
 * in memory.
 */
class CustomFieldDefinitions
{
    /** @var array<string, Collection<int, CustomFieldGroup>> */
    private array $groups = [];

    /** @var array<string, array<string, CustomFieldDefinition>> */
    private array $fields = [];

    public function flush(): void
    {
        $this->groups = [];
        $this->fields = [];
    }

    /**
     * All groups of the entity, in section → position order.
     *
     * @return Collection<int, CustomFieldGroup>
     */
    public function groups(CustomFieldEntity $entity): Collection
    {
        if (! isset($this->groups[$entity->value])) {
            $sectionOrder = array_flip(array_keys($entity->sections()));

            $this->groups[$entity->value] = CustomFieldGroup::query()
                ->where('entity', $entity->value)
                ->with(['formTemplate.latestVersion', 'animalTypes'])
                ->get()
                ->sortBy([
                    fn (CustomFieldGroup $a, CustomFieldGroup $b) => ($sectionOrder[$a->section] ?? 99) <=> ($sectionOrder[$b->section] ?? 99),
                    fn (CustomFieldGroup $a, CustomFieldGroup $b) => $a->position <=> $b->position,
                    fn (CustomFieldGroup $a, CustomFieldGroup $b) => strcmp($a->title, $b->title),
                ])
                ->values();
        }

        return $this->groups[$entity->value];
    }

    /**
     * Every field of the entity by key. Keys are unique per entity, so a key
     * identifies exactly one field and one group.
     *
     * @return array<string, CustomFieldDefinition>
     */
    public function fields(CustomFieldEntity $entity): array
    {
        if (! isset($this->fields[$entity->value])) {
            $this->fields[$entity->value] = [];

            foreach ($this->groups($entity) as $group) {
                foreach ($group->fieldDefinitions() as $field) {
                    $this->fields[$entity->value][$field->key] ??= $field;
                }
            }
        }

        return $this->fields[$entity->value];
    }

    public function field(CustomFieldEntity $entity, string $key): ?CustomFieldDefinition
    {
        return $this->fields($entity)[$key] ?? null;
    }

    /**
     * Groups in scope for a record with the given scope.
     *
     * @param  list<string>  $personRoles
     * @return Collection<int, CustomFieldGroup>
     */
    public function inScope(CustomFieldEntity $entity, ?string $animalTypeId, array $personRoles = []): Collection
    {
        return $this->groups($entity)
            ->filter(fn (CustomFieldGroup $group) => $group->isInScope($animalTypeId, $personRoles))
            ->values();
    }

    /**
     * Groups shown for a record: in scope, or holding a value for at least
     * one of their keys ("filled fields stay visible").
     *
     * @param  Model&HasCustomFields  $record
     * @return list<array{group: CustomFieldGroup, in_scope: bool}>
     */
    public function shownFor(Model $record): array
    {
        [$animalTypeId, $roles] = $record->customFieldScope();
        $values = $record->custom_fields ?? [];
        $shown = [];

        foreach ($this->groups($record->customFieldEntity()) as $group) {
            $inScope = $group->isInScope($animalTypeId, $roles);
            $hasValue = array_intersect($group->keys(), array_keys($values)) !== [];

            if ($inScope || $hasValue) {
                $shown[] = ['group' => $group, 'in_scope' => $inScope];
            }
        }

        return $shown;
    }

    /**
     * Fields published by the Public API for animals of a type: fields marked
     * public in groups in scope for that type. Leftover values of groups no
     * longer in scope are never published.
     *
     * @return list<CustomFieldDefinition>
     */
    public function publicAnimalFields(?string $animalTypeId): array
    {
        $fields = [];

        foreach ($this->inScope(CustomFieldEntity::ANIMAL, $animalTypeId) as $group) {
            foreach ($group->fieldDefinitions() as $field) {
                if ($field->isPublic()) {
                    $fields[] = $field;
                }
            }
        }

        return $fields;
    }
}
