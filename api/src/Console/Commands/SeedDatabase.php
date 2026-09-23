<?php

namespace Taily\Console\Commands;

use Database\Seeders\Support\SeedProfile;
use Database\Seeders\Support\SeedRandom;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;
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
                            {--password= : Password for the demo users (defaults to Test!234)}
                            {--force : Skip the confirmation this would ask for in production}';

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
            SeedRandom::seed((int) $seed);

            if (array_sum($profile->counts('media')) > 0) {
                $this->warn(
                    'Pictures are on, so this run will not reproduce exactly — generating image '
                    .'conversions draws randomness the seeder does not control. Add '
                    .'--set=media.people=0 --set=media.animals=0 for an identical run.'
                );
            }
        }

        if (! $this->option('fresh') && $this->alreadySeeded()) {
            $this->error('The database already holds seeded data. Seeding again would collide with it — pass --fresh to reset the database first.');

            return self::FAILURE;
        }

        Config::set('seeder.password', $this->option('password') ?? config('seeder.password', 'Test!234'));

        $this->laravel->instance(SeedProfile::class, $profile);

        // Both child commands ask before touching a production database, and
        // --force is passed on rather than assumed, so `app:seed --fresh`
        // cannot drop the tables of a production database unattended.
        $confirmation = array_filter(['--force' => (bool) $this->option('force')]);

        if ($this->option('fresh')) {
            $this->call('migrate:fresh', $confirmation);
        }

        $startedAt = microtime(true);

        $this->call('db:seed', $confirmation);

        $this->summarise($profile, microtime(true) - $startedAt);

        return self::SUCCESS;
    }

    /**
     * The seeder is not additive — it always creates the same two login
     * accounts — so a second run over the same database collides on them.
     */
    private function alreadySeeded(): bool
    {
        return Schema::hasTable('users') && User::query()->exists();
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
                self::picturesColumn($profile),
            ];
        }

        $this->table(['Profile', 'Purpose', 'People', 'Animals', 'Adoptions', 'Pictures'], $rows);
    }

    /**
     * The share of animals and people carrying a picture, which is what makes
     * one profile slow and another quick.
     */
    private static function picturesColumn(SeedProfile $profile): string
    {
        $media = $profile->counts('media');

        if (array_sum($media) < 1) {
            return 'none';
        }

        return sprintf('%d%% animals, %d%% people', $media['animals'] ?? 0, $media['people'] ?? 0);
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
