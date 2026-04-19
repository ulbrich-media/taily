<?php

namespace Taily\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Config;

class SeedDatabase extends Command
{
    protected $signature = 'app:seed
                            {--password= : Password for the demo users (defaults to Test!234)}';

    protected $description = 'Seed the database with demo data';

    public function handle(): int
    {
        $password = $this->option('password') ?? 'Test!234';

        Config::set('seeder.password', $password);

        $this->call('db:seed');

        return self::SUCCESS;
    }
}
