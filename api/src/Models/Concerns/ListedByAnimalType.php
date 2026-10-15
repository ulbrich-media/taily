<?php

namespace Taily\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Taily\Models\AnimalType;

/**
 * List scopes of the models that belong to an animal type and are listed
 * together, grouped by it (vaccinations and medical tests).
 */
trait ListedByAnimalType
{
    /**
     * Apply the filters of the list. Unknown names are ignored here; the list
     * request rejects them before they get this far.
     *
     * @param  array<string, string|list<string>>  $filters
     */
    public function scopeFilterBy(Builder $query, array $filters): void
    {
        if (! empty($filters['animal_type_id'])) {
            $query->where($query->getModel()->getTable().'.animal_type_id', $filters['animal_type_id']);
        }
    }

    /**
     * Group by animal type (its title), then order by the item's title. Ties
     * are broken by id, so rows never repeat or vanish between pages.
     */
    public function scopeOrderedByAnimalType(Builder $query): void
    {
        $table = $query->getModel()->getTable();

        $query
            ->orderBy(AnimalType::query()->select('title')->whereColumn('animal_types.id', "{$table}.animal_type_id"))
            ->orderBy("{$table}.title")
            ->orderBy("{$table}.id");
    }
}
