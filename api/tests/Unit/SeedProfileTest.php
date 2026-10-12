<?php

namespace Taily\Tests\Unit;

use Database\Seeders\Support\SeedProfile;
use InvalidArgumentException;
use Taily\Tests\TestCase;

class SeedProfileTest extends TestCase
{
    public function test_it_resolves_a_profile_by_name(): void
    {
        $profile = SeedProfile::resolve('minimal');

        $this->assertSame('minimal', $profile->name);
        $this->assertGreaterThan(0, $profile->int('people'));
    }

    public function test_it_falls_back_to_the_configured_default(): void
    {
        config()->set('seeder.default_profile', 'minimal');

        $this->assertSame('minimal', SeedProfile::resolve()->name);
    }

    public function test_it_names_the_alternatives_when_a_profile_does_not_exist(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessageMatches('/Unknown seeder profile \[nope\].*minimal/');

        SeedProfile::resolve('nope');
    }

    public function test_an_override_replaces_a_single_value(): void
    {
        $profile = SeedProfile::resolve('minimal', ['adoptions' => 500]);

        $this->assertSame(500, $profile->int('adoptions'));
        $this->assertSame(SeedProfile::resolve('minimal')->int('people'), $profile->int('people'));
    }

    public function test_an_override_reaches_into_a_nested_value(): void
    {
        $profile = SeedProfile::resolve('minimal', ['media.animals' => 0, 'animals.dogs' => 7]);

        $this->assertSame(0, $profile->counts('media')['animals']);
        $this->assertSame(7, $profile->counts('animals')['dogs']);
    }

    public function test_it_reads_a_range_and_keeps_it_the_right_way_round(): void
    {
        $profile = SeedProfile::fromArray('test', ['span' => [8, 3]]);

        $this->assertSame([8, 8], $profile->range('span'));
        $this->assertSame([2, 5], $profile->range('missing', [2, 5]));
    }

    public function test_a_missing_count_reads_as_zero(): void
    {
        $this->assertSame(0, SeedProfile::fromArray('test', [])->int('adoptions'));
        $this->assertSame([], SeedProfile::fromArray('test', [])->counts('animals'));
    }
}
