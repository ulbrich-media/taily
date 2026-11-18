<?php

namespace Taily\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Taily\Support\Tiervermittlung\TiervermittlungException;
use Taily\Support\Tiervermittlung\TiervermittlungExport;

class SyncTiervermittlung extends Command
{
    protected $signature = 'tiervermittlung:sync
        {--probe : Dry run — show what the platform would publish, without creating or storing anything}
        {--limit= : Maximum number of requests (default: taily.tiervermittlung.max_requests_per_run)}';

    protected $description = 'Send new and changed animals to Tiervermittlung.de and remove the ones no longer exported';

    public function handle(TiervermittlungExport $export): int
    {
        // The scheduler runs this every few minutes on every install; an
        // install without the export is the normal case. Dry runs work
        // without switching the export on.
        if (! $this->option('probe') && ! TiervermittlungExport::isEnabled()) {
            $this->line('Der Export ist nicht aktiviert (TAILY_TIERVERMITTLUNG_ENABLED).');

            return self::SUCCESS;
        }

        if ($problems = TiervermittlungExport::configurationProblems()) {
            foreach ($problems as $problem) {
                $this->error($problem);
            }

            return self::FAILURE;
        }

        $limit = $this->option('limit') !== null ? (int) $this->option('limit') : null;

        try {
            return $this->option('probe') ? $this->probe($export, $limit) : $this->sync($export, $limit);
        } catch (TiervermittlungException $e) {
            Log::error('Tiervermittlung.de export aborted', ['status' => $e->status, 'error' => $e->describe()]);
            $this->error("Abgebrochen: {$e->describe()}");

            return self::FAILURE;
        }
    }

    private function sync(TiervermittlungExport $export, ?int $limit): int
    {
        $counts = $export->sync($limit ?? (int) config('taily.tiervermittlung.max_requests_per_run'));

        $this->info(sprintf(
            'Gesendet: %d, unverändert: %d, entfernt: %d, fehlgeschlagen: %d, auf den nächsten Lauf verschoben: %d',
            $counts['sent'], $counts['unchanged'], $counts['removed'], $counts['failed'], $counts['deferred'],
        ));

        return $counts['failed'] > 0 ? self::FAILURE : self::SUCCESS;
    }

    private function probe(TiervermittlungExport $export, ?int $limit): int
    {
        foreach ($export->probe($limit) as ['animal' => $animal, 'result' => $result, 'error' => $error]) {
            $this->line("<options=bold>{$animal->name}</> ({$animal->id})");

            if ($error !== null) {
                $this->error("  Fehler: {$error}");

                continue;
            }

            $this->line('  Status: '.($result['status'] ?? '?').', Bilder: '.($result['bilder'] ?? '?'));

            foreach ($result['gruende'] ?? [] as $reason) {
                $this->warn("  Grund: {$reason}");
            }

            foreach ($result['warnungen'] ?? [] as $warning) {
                $this->warn("  Hinweis: {$warning}");
            }

            if ($this->output->isVerbose()) {
                $this->line('  '.json_encode($result['anzeige'] ?? [], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
            }
        }

        foreach ($export->excluded() as ['animal' => $animal, 'reasons' => $reasons]) {
            $this->line("<fg=gray>{$animal->name} ({$animal->id}) wird nicht exportiert: ".implode(' ', $reasons).'</>');
        }

        return self::SUCCESS;
    }
}
