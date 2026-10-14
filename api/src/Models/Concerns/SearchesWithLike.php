<?php

namespace Taily\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;

trait SearchesWithLike
{
    /**
     * Case-insensitive contains match; LIKE wildcards in the term are escaped.
     */
    private static function whereLike(Builder $query, string $column, string $term, string $boolean = 'and'): void
    {
        $pattern = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $term).'%';
        $column = $query->getQuery()->getGrammar()->wrap($column);

        $query->whereRaw("{$column} like ? escape ?", [$pattern, '!'], $boolean);
    }
}
