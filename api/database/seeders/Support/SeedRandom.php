<?php

namespace Database\Seeders\Support;

use Illuminate\Support\Collection;

/**
 * Picking from a collection, seedably.
 *
 * Collection::random() and Collection::shuffle() go through \Random\Randomizer,
 * which defaults to a cryptographic engine and cannot be seeded — a run using
 * them can never be reproduced. Everything here draws from mt_rand instead,
 * the same source Faker uses, so `app:seed --seed=` reproduces a whole run.
 */
class SeedRandom
{
    /**
     * @template TValue
     *
     * @param  Collection<array-key, TValue>  $items
     * @return TValue|null
     */
    public static function pick(Collection $items)
    {
        if ($items->isEmpty()) {
            return null;
        }

        return $items->values()->get(mt_rand(0, $items->count() - 1));
    }

    /**
     * @template TValue
     *
     * @param  Collection<array-key, TValue>  $items
     * @return Collection<int, TValue>
     */
    public static function pickMany(Collection $items, int $count): Collection
    {
        return self::shuffle($items)->take(max(0, $count));
    }

    /**
     * @template TValue
     *
     * @param  Collection<array-key, TValue>  $items
     * @return Collection<int, TValue>
     */
    public static function shuffle(Collection $items): Collection
    {
        $values = $items->values()->all();

        shuffle($values);

        return new Collection($values);
    }
}
