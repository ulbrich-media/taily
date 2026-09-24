<?php

namespace Taily\Tests\Unit;

use Database\Seeders\Support\SeedImages;
use Taily\Tests\TestCase;

class SeedImagesTest extends TestCase
{
    public function test_nobody_gets_a_picture_when_the_share_is_zero(): void
    {
        $images = new SeedImages('dogs', 0);

        $this->assertSame([], array_filter($this->pick($images, 100)));
    }

    public function test_everybody_gets_one_when_the_share_is_full(): void
    {
        $images = new SeedImages('dogs', 100);

        $picks = $this->pick($images, 50);

        $this->assertCount(50, array_filter($picks));
    }

    /**
     * The share is what decides coverage, not how many files happen to sit in
     * seeder-assets.
     */
    public function test_roughly_the_given_share_gets_a_picture(): void
    {
        $images = new SeedImages('dogs', 40);

        $pictured = count(array_filter($this->pick($images, 4000)));

        // Four thousand draws at 40%: well outside any plausible run of luck.
        $this->assertGreaterThan(1400, $pictured);
        $this->assertLessThan(1800, $pictured);
    }

    /**
     * With few files and many animals the same photo has to come round again,
     * but it should not come round while others have not been used at all.
     */
    public function test_it_uses_every_picture_before_reusing_one(): void
    {
        $images = new SeedImages('dogs', 100);

        $available = count(array_unique($this->pick($images, 1000)));
        $this->assertGreaterThan(1, $available, 'expected seeder-assets/dogs to hold several files');

        $counts = array_count_values($this->pick(new SeedImages('dogs', 100), $available * 3));

        $this->assertSame([3], array_unique(array_values($counts)), 'pictures were not handed out evenly');
    }

    public function test_a_directory_without_files_hands_out_nothing(): void
    {
        $images = new SeedImages('does-not-exist', 100);

        $this->assertSame([], array_filter($this->pick($images, 20)));
    }

    /**
     * @return list<string|null>
     */
    private function pick(SeedImages $images, int $times): array
    {
        $picks = [];

        for ($i = 0; $i < $times; $i++) {
            $picks[] = $images->pick();
        }

        return $picks;
    }
}
