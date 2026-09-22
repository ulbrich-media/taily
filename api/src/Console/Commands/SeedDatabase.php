<?php

namespace Taily\Console\Commands;

use Database\Seeders\Support\SeedProfile;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Ramsey\Uuid\Uuid;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\Organization;
use Taily\Models\Person;
use Taily\Models\PreInspection;
use Taily\Models\Transport;
use Taily\Models\User;

class SeedDatabase extends Command
{
    protected $signature = 'app:seed
                            {--profile= : Which data set to seed (see --list)}
                            {--set=* : Override one profile value, e.g. --set=adoptions=500 --set=media.animals=0}
                            {--fresh : Drop all tables and migrate before seeding}
                            {--seed= : Random seed, so the same run produces the same data}
                            {--list : Show the available profiles and what they contain}
                            {--password= : Password for the demo users (defaults to Test!234)}';

    protected $description = 'Seed the database with demo data';

    public function handle(): int
    {
        if ($this->option('list')) {
            $this->listProfiles();

            return self::SUCCESS;
        }

        try {
            $profile = SeedProfile::resolve($this->option('profile'), $this->overrides());
        } catch (InvalidArgumentException $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        if ($seed = $this->option('seed')) {
            $this->makeRunReproducible((int) $seed);

            if (array_sum($profile->counts('media')) > 0) {
                $this->warn(
                    'Pictures are on, so this run will not reproduce exactly — generating image '
                    .'conversions draws randomness the seeder does not control. Add '
                    .'--set=media.people=0 --set=media.animals=0 for an identical run.'
                );
            }
        }

        Config::set('seeder.password', $this->option('password') ?? config('seeder.password', 'Test!234'));

        $this->laravel->instance(SeedProfile::class, $profile);

        if ($this->option('fresh')) {
            $this->call('migrate:fresh', ['--force' => true]);
        }

        $startedAt = microtime(true);

        $this->call('db:seed', ['--force' => true]);

        $this->summarise($profile, microtime(true) - $startedAt);

        return self::SUCCESS;
    }

    /**
     * Pins every source of randomness the seeders draw from.
     *
     * Faker and the seeders' own picks come from mt_rand, so seeding that
     * covers the values. The model keys do not: Str::uuid7() mixes in fresh
     * entropy, and because rows come back ordered by their key, two runs would
     * otherwise hand the seeders their animals and people in a different
     * order. A counter-based factory keeps the keys both ordered and
     * predictable.
     *
     * One thing stays outside this: generating image conversions draws from
     * sources the seeder cannot reach, so a run that attaches pictures drifts
     * from the seeded stream. Turn the pictures off for an identical run —
     * which is what the large profile does anyway.
     */
    private function makeRunReproducible(int $seed): void
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
     * @return array<string, string>
     */
    private function overrides(): array
    {
        $overrides = [];

        foreach ((array) $this->option('set') as $assignment) {
            if (! str_contains((string) $assignment, '=')) {
                $this->warn("Ignoring --set={$assignment}: expected key=value.");

                continue;
            }

            [$key, $value] = explode('=', (string) $assignment, 2);

            $overrides[trim($key)] = trim($value);
        }

        return $overrides;
    }

    private function listProfiles(): void
    {
        $default = config('seeder.default_profile');

        $rows = [];

        foreach (array_keys((array) config('seeder.profiles', [])) as $name) {
            $profile = SeedProfile::resolve($name);

            $rows[] = [
                $name.($name === $default ? ' (default)' : ''),
                $profile->label(),
                $profile->int('people'),
                array_sum($profile->counts('animals')),
                $profile->int('adoptions'),
                array_sum($profile->counts('media')) > 0 ? 'yes' : 'no',
            ];
        }

        $this->table(['Profile', 'Purpose', 'People', 'Animals', 'Adoptions', 'Pictures'], $rows);
    }

    private function summarise(SeedProfile $profile, float $seconds): void
    {
        $this->newLine();
        $this->table(['Seeded', 'Count'], [
            ['Users', User::count()],
            ['Organizations', Organization::count()],
            ['People', Person::count()],
            ['Animals', Animal::count()],
            ['Adoptions', Adoption::count()],
            ['Pre-inspections', PreInspection::count()],
            ['Transports', Transport::count()],
        ]);

        $this->info(sprintf('Profile [%s] seeded in %.1fs.', $profile->name, $seconds));
    }
}
