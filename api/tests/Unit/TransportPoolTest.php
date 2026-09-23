<?php

namespace Taily\Tests\Unit;

use Database\Seeders\Support\TransportPool;
use Faker\Factory as Faker;
use Illuminate\Support\Collection;
use PHPUnit\Framework\TestCase;

class TransportPoolTest extends TestCase
{
    /**
     * A run that carries one animal is not worth organising, and one that
     * carries forty does not fit in a van.
     */
    public function test_every_run_stays_within_the_given_bounds(): void
    {
        [$minimum, $maximum] = [4, 15];

        $pool = $this->pool([$minimum, $maximum]);

        // The awkward sizes are the ones just past a full run, where the
        // remainder is too small to stand on its own.
        foreach (range($minimum, 200) as $adoptions) {
            $sizes = $pool->runSizes($adoptions);

            $this->assertSame($adoptions, array_sum($sizes), "$adoptions adoptions: not all of them were placed");

            foreach ($sizes as $size) {
                $this->assertGreaterThanOrEqual($minimum, $size, "$adoptions adoptions: a run came out too small");
                $this->assertLessThanOrEqual($maximum, $size, "$adoptions adoptions: a run came out too big");
            }
        }
    }

    public function test_too_few_adoptions_for_one_run_still_gives_one_run(): void
    {
        $pool = $this->pool([4, 15]);

        $this->assertSame([1], $pool->runSizes(1));
        $this->assertSame([3], $pool->runSizes(3));
    }

    public function test_a_single_full_run_is_not_split(): void
    {
        $pool = $this->pool([4, 15]);

        $this->assertSame([15], $pool->runSizes(15));
    }

    public function test_nothing_to_place_means_no_runs(): void
    {
        $this->assertSame([], $this->pool([4, 15])->runSizes(0));
    }

    /**
     * The bounds are configurable, so the guarantee has to hold for whatever
     * a profile asks for.
     */
    public function test_the_bounds_hold_for_other_ranges(): void
    {
        foreach ([[2, 3], [1, 1], [10, 40], [4, 15]] as [$minimum, $maximum]) {
            $pool = $this->pool([$minimum, $maximum]);

            foreach ([$minimum, $minimum + 1, $maximum + 1, $maximum * 3 + 1, 97] as $adoptions) {
                $sizes = $pool->runSizes($adoptions);

                $this->assertSame($adoptions, array_sum($sizes));

                foreach ($sizes as $size) {
                    $this->assertGreaterThanOrEqual($minimum, $size, "[$minimum, $maximum] with $adoptions adoptions");
                    $this->assertLessThanOrEqual($maximum, $size, "[$minimum, $maximum] with $adoptions adoptions");
                }
            }
        }
    }

    /**
     * Some ranges are too narrow to divide cleanly: five to six animals a run
     * leaves seven adoptions fitting neither one run nor two. The minimum is
     * the one worth keeping, so the run runs over instead.
     */
    public function test_a_range_too_narrow_to_divide_keeps_the_minimum(): void
    {
        $sizes = $this->pool([5, 6])->runSizes(7);

        $this->assertSame([7], $sizes);
        $this->assertGreaterThanOrEqual(5, $sizes[0]);
    }

    /**
     * @param  array{int, int}  $capacityRange
     */
    private function pool(array $capacityRange): TransportPool
    {
        return new TransportPool(Faker::create('de_DE'), new Collection, $capacityRange);
    }
}
