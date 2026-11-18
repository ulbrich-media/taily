<?php

namespace Taily\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Taily\Support\Tiervermittlung\TiervermittlungException;
use Taily\Support\Tiervermittlung\TiervermittlungExport;

class ReconcileTiervermittlung extends Command
{
    protected $signature = 'tiervermittlung:reconcile';

    protected $description = 'Remove listings on Tiervermittlung.de that this installation no longer exports';

    public function handle(TiervermittlungExport $export): int
    {
        if (! TiervermittlungExport::isEnabled() || TiervermittlungExport::configurationProblems()) {
            return self::SUCCESS;
        }

        try {
            $result = $export->reconcile();
        } catch (TiervermittlungException $e) {
            Log::error('Tiervermittlung.de reconciliation failed', ['status' => $e->status, 'error' => $e->describe()]);
            $this->error("Fehlgeschlagen: {$e->describe()}");

            return self::FAILURE;
        }

        if ($result === null) {
            $this->info('Keine Tiere gelistet, kein Abgleich nötig.');

            return self::SUCCESS;
        }

        if ($result['bremse'] ?? false) {
            $this->warn('Die Sicherheitsbremse hat gegriffen, es wurde nichts entfernt. '.($result['hinweis'] ?? ''));

            return self::SUCCESS;
        }

        $this->info(sprintf(
            'Behalten: %d, entfernt: %d, unbekannt (werden neu gesendet): %d',
            $result['behalten'] ?? 0, count($result['entfernt'] ?? []), count($result['unbekannt'] ?? []),
        ));

        return self::SUCCESS;
    }
}
