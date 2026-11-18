<?php

namespace Taily\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Support\Facades\Log;
use Taily\Support\Tiervermittlung\TiervermittlungException;
use Taily\Support\Tiervermittlung\TiervermittlungExport;

class ReconcileTiervermittlung extends Command
{
    protected $signature = 'tiervermittlung:reconcile';

    protected $description = 'Remove listings on Tiervermittlung.de that this installation no longer exports';

    private const LOCK_WAIT_SECONDS = 300;

    public function handle(TiervermittlungExport $export): int
    {
        if (! TiervermittlungExport::isEnabled() || TiervermittlungExport::configurationProblems()) {
            return self::SUCCESS;
        }

        // Waits for a running sync: the list handed to the platform must not
        // miss animals that sync is adding at the same time, or the platform
        // would remove them again.
        $lock = TiervermittlungExport::lock();

        try {
            $lock->block(self::LOCK_WAIT_SECONDS);
        } catch (LockTimeoutException) {
            $this->error('Ein Export-Lauf ist noch aktiv, der Abgleich wurde übersprungen.');

            return self::FAILURE;
        }

        try {
            $result = $export->reconcile();
        } catch (TiervermittlungException $e) {
            Log::error('Tiervermittlung.de reconciliation failed', ['status' => $e->status, 'error' => $e->describe()]);
            $this->error("Fehlgeschlagen: {$e->describe()}");

            return self::FAILURE;
        } finally {
            $lock->release();
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
