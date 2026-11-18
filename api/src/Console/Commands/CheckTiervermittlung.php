<?php

namespace Taily\Console\Commands;

use Illuminate\Console\Command;
use Taily\Support\Tiervermittlung\TiervermittlungClient;
use Taily\Support\Tiervermittlung\TiervermittlungException;
use Taily\Support\Tiervermittlung\TiervermittlungExport;

class CheckTiervermittlung extends Command
{
    protected $signature = 'tiervermittlung:check';

    protected $description = 'Check the Tiervermittlung.de configuration and connection';

    public function handle(TiervermittlungClient $client): int
    {
        if ($problems = TiervermittlungExport::configurationProblems()) {
            foreach ($problems as $problem) {
                $this->error($problem);
            }

            return self::FAILURE;
        }

        try {
            $account = $client->account();
        } catch (TiervermittlungException $e) {
            $this->error("Verbindung fehlgeschlagen: {$e->describe()}");

            return self::FAILURE;
        }

        $this->info('Verbindung zu Tiervermittlung.de steht.');

        if (! TiervermittlungExport::isEnabled()) {
            $this->warn('Der Export ist noch nicht aktiviert (TAILY_TIERVERMITTLUNG_ENABLED), es wird nichts automatisch gesendet.');
        }

        $this->line(json_encode($account, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

        return self::SUCCESS;
    }
}
