<?php

namespace Database\Seeders\Support;

use Illuminate\Support\Arr;
use InvalidArgumentException;

/**
 * How much of what to seed.
 *
 * Resolves a named profile from config/seeder.php and layers the overrides a
 * caller passed on top, so the shape of a data set is a parameter rather than
 * a set of numbers spread through the seeders.
 */
class SeedProfile
{
    /**
     * @param  array<string, mixed>  $values
     */
    private function __construct(
        public readonly string $name,
        private readonly array $values,
    ) {}

    /**
     * @param  array<string, mixed>  $overrides  dot-keyed, e.g. ['adoptions' => 500, 'media.animals' => 0]
     */
    public static function resolve(?string $name = null, array $overrides = []): self
    {
        $name ??= config('seeder.default_profile', 'dev');

        /** @var array<string, array<string, mixed>> $profiles */
        $profiles = config('seeder.profiles', []);

        if (! isset($profiles[$name])) {
            throw new InvalidArgumentException(sprintf(
                'Unknown seeder profile [%s]. Available profiles: %s.',
                $name,
                implode(', ', array_keys($profiles)) ?: 'none configured'
            ));
        }

        $values = $profiles[$name];

        foreach ($overrides as $key => $value) {
            Arr::set($values, $key, $value);
        }

        return new self($name, $values);
    }

    /**
     * @param  array<string, mixed>  $values
     */
    public static function fromArray(string $name, array $values): self
    {
        return new self($name, $values);
    }

    public function label(): string
    {
        return (string) ($this->values['label'] ?? $this->name);
    }

    public function int(string $key, int $default = 0): int
    {
        return (int) Arr::get($this->values, $key, $default);
    }

    /**
     * @return array<string, int>
     */
    public function counts(string $key): array
    {
        /** @var array<string, mixed> $counts */
        $counts = Arr::get($this->values, $key, []);

        return array_map(intval(...), $counts);
    }

    /**
     * @param  array{int, int}  $default
     * @return array{int, int}
     */
    public function range(string $key, array $default = [1, 1]): array
    {
        /** @var array<int, mixed> $range */
        $range = Arr::get($this->values, $key, $default);

        $min = (int) ($range[0] ?? $default[0]);
        $max = (int) ($range[1] ?? $min);

        return [$min, max($min, $max)];
    }

    /**
     * The whole profile, for printing it back to whoever asked for it.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return $this->values;
    }
}
