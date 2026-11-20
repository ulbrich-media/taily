<?php

namespace Taily\Support\Tiervermittlung;

use Illuminate\Contracts\Cache\Lock;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Taily\Models\Animal;
use Taily\Models\TiervermittlungListing;

/**
 * Keeps the animals on Tiervermittlung.de in step with Taily. Every run
 * compares each animal's payload with the hash of the last delivery, so
 * there is no event wiring: whatever changed — fields, pictures, an
 * adoption completing — shows up as a different payload or as an animal
 * that is no longer exported.
 */
class TiervermittlungExport
{
    /**
     * Listings expire after 92 days without a delivery, so unchanged animals
     * are sent again well before that.
     */
    public const REFRESH_AFTER_DAYS = 30;

    /**
     * Upper bound for one run holding the lock, in case a process dies
     * without releasing it.
     */
    private const LOCK_SECONDS = 900;

    public function __construct(
        private TiervermittlungClient $client,
        private AnimalPayloadMapper $mapper,
    ) {}

    /**
     * Serializes sync and reconciliation: reconciliation hands the platform
     * a snapshot of the listed animals, so a sync adding animals in between
     * would get them removed again.
     */
    public static function lock(): Lock
    {
        return Cache::lock('tiervermittlung-export', self::LOCK_SECONDS);
    }

    public static function isEnabled(): bool
    {
        return (bool) config('taily.tiervermittlung.enabled');
    }

    /**
     * What keeps the export from talking to the platform, as German text.
     * Empty when the configuration is complete. Independent of `enabled`, so
     * dry runs work before the export is switched on.
     *
     * @return list<string>
     */
    public static function configurationProblems(): array
    {
        $config = config('taily.tiervermittlung');
        $problems = [];

        if (($config['api_key'] ?? '') === '') {
            $problems[] = 'Es ist kein API-Schlüssel hinterlegt (TAILY_TIERVERMITTLUNG_API_KEY).';
        }

        return $problems;
    }

    /**
     * Send new and changed animals, refresh old deliveries and remove the
     * listings of animals that are no longer exported. Stops after
     * `$maxDeliveries` animals sent or removed; the rest is picked up by
     * the next run.
     *
     * @return array{sent: int, unchanged: int, removed: int, failed: int, deferred: int}
     *
     * @throws TiervermittlungException when the key is rejected; nothing else
     *                                  can succeed in that case
     */
    public function sync(int $maxDeliveries): array
    {
        $counts = ['sent' => 0, 'unchanged' => 0, 'removed' => 0, 'failed' => 0, 'deferred' => 0];
        $budget = $maxDeliveries;

        foreach ($this->listingsToRemove() as $listing) {
            if ($budget-- <= 0) {
                $counts['deferred']++;

                continue;
            }

            $this->remove($listing) ? $counts['removed']++ : $counts['failed']++;
        }

        [$due, $unchanged] = $this->animalsToSend();
        $counts['unchanged'] = $unchanged;

        foreach ($due as $animal) {
            if ($budget-- <= 0) {
                $counts['deferred']++;

                continue;
            }

            $this->send($animal) ? $counts['sent']++ : $counts['failed']++;
        }

        return $counts;
    }

    /**
     * Dry run for every exported animal: the platform answers with what the
     * listing would look like, nothing is created and nothing is stored.
     *
     * @return list<array{animal: Animal, result: array<string, mixed>|null, error: string|null}>
     *
     * @throws TiervermittlungException when the key is rejected
     */
    public function probe(?int $limit = null): array
    {
        $results = [];

        foreach ($this->exportableAnimals()->take($limit ?? PHP_INT_MAX) as $animal) {
            try {
                $result = $this->client->putAnimal($this->mapper->tierId($animal), $this->mapper->payload($animal), probe: true);
                $results[] = ['animal' => $animal, 'result' => $result, 'error' => null];
            } catch (TiervermittlungException $e) {
                if ($e->isAuthError()) {
                    throw $e;
                }

                $results[] = ['animal' => $animal, 'result' => null, 'error' => $e->describe()];
            }
        }

        return $results;
    }

    /**
     * Published animals that are kept out of the export, with the reasons.
     *
     * @return list<array{animal: Animal, reasons: list<string>}>
     */
    public function excluded(): array
    {
        return $this->candidates()
            ->filter(fn (Animal $animal) => $animal->do_publish)
            ->map(fn (Animal $animal) => ['animal' => $animal, 'reasons' => $this->mapper->exclusionReasons($animal)])
            ->filter(fn (array $entry) => $entry['reasons'] !== [])
            ->values()
            ->all();
    }

    /**
     * Hand the platform the full list of listed animals, so listings this
     * installation lost track of are removed there too. Animals the
     * platform does not know are sent again on the next sync.
     *
     * @return array<string, mixed>|null the platform's answer, or null when
     *                                   there was nothing to reconcile
     *
     * @throws TiervermittlungException
     */
    public function reconcile(): ?array
    {
        $tierIds = TiervermittlungListing::query()
            ->whereNotNull('animal_id')
            ->where('status', '!=', TiervermittlungListing::STATUS_REJECTED)
            ->pluck('tier_id')
            ->all();

        // An empty list would ask the platform to remove everything; the
        // removals of single animals already happen during sync.
        if ($tierIds === []) {
            return null;
        }

        $result = $this->client->reconcile($tierIds);

        if ($result['bremse'] ?? false) {
            Log::warning('Tiervermittlung.de reconciliation was stopped by the safety brake', [
                'hint' => $result['hinweis'] ?? null,
            ]);
        }

        $unknown = $result['unbekannt'] ?? [];

        if ($unknown !== []) {
            TiervermittlungListing::whereIn('tier_id', $unknown)->update(['payload_hash' => '']);
        }

        return $result;
    }

    /**
     * Animals that are sent to the platform.
     *
     * @return Collection<int, Animal>
     */
    public function exportableAnimals(): Collection
    {
        return $this->candidates()
            ->filter(fn (Animal $animal) => $this->mapper->isExportable($animal))
            ->values();
    }

    /**
     * Published animals and every animal that still has a listing.
     *
     * @return Collection<int, Animal>
     */
    private function candidates(): Collection
    {
        return Animal::query()
            ->where(fn (Builder $query) => $query
                ->where('do_publish', true)
                ->orWhereHas('tiervermittlungListing'))
            ->with(['animalType', 'media', 'adoptions', 'compatibilities', 'personalityTraits', 'tiervermittlungListing'])
            ->orderBy('id')
            ->get();
    }

    /**
     * Listings of deleted animals and of animals that are no longer exported.
     *
     * @return Collection<int, TiervermittlungListing>
     */
    private function listingsToRemove(): Collection
    {
        $orphans = TiervermittlungListing::whereNull('animal_id')->get();

        $withdrawn = $this->candidates()
            ->filter(fn (Animal $animal) => $animal->tiervermittlungListing !== null && ! $this->mapper->isExportable($animal))
            ->map(fn (Animal $animal) => $animal->tiervermittlungListing->setRelation('animal', $animal));

        return $orphans->concat($withdrawn)->values();
    }

    /**
     * Exported animals that need a delivery: never sent first, then changed
     * ones, then the oldest refreshes.
     *
     * @return array{0: Collection<int, Animal>, 1: int} the animals due and
     *                                                   the number of unchanged ones
     */
    private function animalsToSend(): array
    {
        $refreshBefore = now()->subDays(self::REFRESH_AFTER_DAYS);
        $exportable = $this->exportableAnimals();

        $due = $exportable->filter(function (Animal $animal) use ($refreshBefore) {
            $listing = $animal->tiervermittlungListing;

            if ($listing === null || $listing->payload_hash !== $this->mapper->hash($this->mapper->payload($animal))) {
                return true;
            }

            // A rejected payload is only sent again once it changes; there
            // is no listing to keep alive.
            return $listing->status !== TiervermittlungListing::STATUS_REJECTED
                && ($listing->last_sent_at === null || $listing->last_sent_at->lt($refreshBefore));
        });

        $sorted = $due->sortBy(fn (Animal $animal) => match (true) {
            $animal->tiervermittlungListing === null => '0',
            $animal->tiervermittlungListing->last_sent_at?->gte($refreshBefore) ?? false => '1',
            default => '2'.$animal->tiervermittlungListing->last_sent_at?->timestamp,
        });

        return [$sorted->values(), $exportable->count() - $due->count()];
    }

    private function send(Animal $animal): bool
    {
        $payload = $this->mapper->payload($animal);
        $listing = $animal->tiervermittlungListing
            ?? new TiervermittlungListing(['animal_id' => $animal->id, 'tier_id' => $this->mapper->tierId($animal)]);

        try {
            $result = $this->client->putAnimal($listing->tier_id, $payload);
        } catch (TiervermittlungException $e) {
            if ($e->isAuthError()) {
                throw $e;
            }

            $listing->last_error = $e->describe();

            // A rejected payload is not sent again until it changes. Anything
            // else (rate limit, outage) is retried on the next run.
            if ($e->isRejection()) {
                $listing->fill([
                    'payload_hash' => $this->mapper->hash($payload),
                    'last_sent_at' => now(),
                ]);

                // A listing that is live keeps its status: the platform still
                // shows the last accepted version, and reconciliation must
                // keep it.
                if (in_array($listing->status, ['', TiervermittlungListing::STATUS_REJECTED], true)) {
                    $listing->status = TiervermittlungListing::STATUS_REJECTED;
                }
            }

            $listing->save();
            $animal->setRelation('tiervermittlungListing', $listing);

            Log::warning('Failed to send animal to Tiervermittlung.de', [
                'animal_id' => $animal->id,
                'status' => $e->status,
                'error' => $e->describe(),
            ]);

            return false;
        }

        $listing->fill([
            'status' => (string) ($result['status'] ?? ''),
            'tv_id' => $result['tvId'] ?? $listing->tv_id,
            'url' => (string) ($result['url'] ?? $listing->url),
            'reasons' => $result['gruende'] ?? [],
            'warnings' => $result['warnungen'] ?? [],
            'payload_hash' => $this->mapper->hash($payload),
            'last_error' => '',
            'last_sent_at' => now(),
        ])->save();
        $animal->setRelation('tiervermittlungListing', $listing);

        return true;
    }

    private function remove(TiervermittlungListing $listing): bool
    {
        try {
            $this->client->deleteAnimal($listing->tier_id, $this->mapper->removalReason($listing->animal));
        } catch (TiervermittlungException $e) {
            if ($e->isAuthError()) {
                throw $e;
            }

            // Already gone on the platform — nothing left to remove.
            if (! $e->isNotFound()) {
                $listing->update(['last_error' => $e->describe()]);

                Log::warning('Failed to remove animal from Tiervermittlung.de', [
                    'tier_id' => $listing->tier_id,
                    'status' => $e->status,
                    'error' => $e->describe(),
                ]);

                return false;
            }
        }

        $listing->delete();

        return true;
    }
}
