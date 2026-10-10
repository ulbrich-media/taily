<?php

namespace Taily\Tests\Unit;

use Database\Seeders\Support\SeedRandom;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Taily\Tests\TestCase;

class SeedRandomTest extends TestCase
{
    protected function tearDown(): void
    {
        Str::createUuidsNormally();
        Str::createRandomStringsNormally();

        parent::tearDown();
    }

    /**
     * What `app:seed --seed=` promises: the same number twice gives the same
     * data twice, keys included.
     */
    public function test_the_same_seed_repeats_the_whole_sequence(): void
    {
        $this->assertSame($this->draw(4242), $this->draw(4242));
    }

    public function test_a_different_seed_gives_a_different_sequence(): void
    {
        $this->assertNotSame($this->draw(4242), $this->draw(9999));
    }

    /**
     * Zero is a seed like any other, and the command has to treat it as one.
     */
    public function test_zero_is_a_seed_like_any_other(): void
    {
        $this->assertSame($this->draw(0), $this->draw(0));
        $this->assertNotSame($this->draw(0), $this->draw(1));
    }

    /**
     * Rows come back ordered by their key, so keys that climb in insertion
     * order are what keeps the seeders reading their records in the same
     * order on a repeated run.
     */
    public function test_the_keys_it_hands_out_climb_in_order(): void
    {
        SeedRandom::seed(7);

        $keys = [(string) Str::uuid7(), (string) Str::uuid7(), (string) Str::uuid7()];

        $sorted = $keys;
        sort($sorted);

        $this->assertSame($sorted, $keys);
        $this->assertSame(3, count(array_unique($keys)));
    }

    public function test_picking_from_a_collection_follows_the_seed(): void
    {
        $items = new Collection(range(1, 50));

        SeedRandom::seed(1234);
        $first = [SeedRandom::pick($items), SeedRandom::shuffle($items)->all()];

        SeedRandom::seed(1234);
        $second = [SeedRandom::pick($items), SeedRandom::shuffle($items)->all()];

        $this->assertSame($first, $second);
    }

    /**
     * @return array<string, mixed>
     */
    private function draw(int $seed): array
    {
        SeedRandom::seed($seed);

        return [
            'numbers' => [mt_rand(), mt_rand()],
            'key' => (string) Str::uuid7(),
            'string' => Str::random(12),
        ];
    }
}
