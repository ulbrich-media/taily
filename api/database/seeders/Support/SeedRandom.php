<?php

namespace Database\Seeders\Support;

use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Ramsey\Uuid\Uuid;

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
     * Pins every source of randomness the seeders draw from, so the same seed
     * produces the same data twice.
     *
     * Faker and the picks below come from mt_rand, so seeding that covers the
     * values. The model keys do not: Str::uuid7() mixes in fresh entropy, and
     * because rows come back ordered by their key, two runs would otherwise
     * hand the seeders their animals and people in a different order. A
     * counter-based factory keeps the keys both ordered and predictable.
     *
     * One thing stays outside this: generating image conversions draws from
     * sources the seeder cannot reach, so a run that attaches pictures drifts
     * from the seeded stream.
     */
    public static function seed(int $seed): void
    {
        mt_srand($seed);

        $counter = 0;

        Str::createUuidsUsing(function () use (&$counter) {
            $bytes = substr(pack('J', ++$counter), 2);

            for ($i = 0; $i < 10; $i++) {
                $bytes .= chr(mt_rand(0, 255));
            }

            $bytes[6] = chr((ord($bytes[6]) & 0x0F) | 0x70);
            $bytes[8] = chr((ord($bytes[8]) & 0x3F) | 0x80);

            return Uuid::fromBytes($bytes);
        });

        Str::createRandomStringsUsing(function (int $length = 16) {
            $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            $string = '';

            for ($i = 0; $i < $length; $i++) {
                $string .= $alphabet[mt_rand(0, strlen($alphabet) - 1)];
            }

            return $string;
        });
    }

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
