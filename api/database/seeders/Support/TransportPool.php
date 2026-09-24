<?php

namespace Database\Seeders\Support;

use Carbon\CarbonImmutable;
use Faker\Generator;
use Illuminate\Support\Collection;
use Taily\Models\Person;
use Taily\Models\Transport;

/**
 * Hands out transport runs while adoptions are being generated.
 *
 * A transport is only worth organising once enough animals are ready for it,
 * so completed runs are scheduled before any adoption is built: the pool works
 * out how many runs the adoptions need, when each one arrived and how many
 * animals it carries, and the adoptions are then laid out around those dates.
 *
 * Doing it the other way round — letting each adoption pick its own dates and
 * looking for a run that fits them — gives every adoption a run of its own,
 * because two adoptions rarely leave room for the same arrival date.
 */
class TransportPool
{
    private const TOUR_NAMES = [
        'Süddeutschland-Tour',
        'Nordroute',
        'Rheinland-Tour',
        'Ostroute',
        'Alpenroute',
        'Sammeltransport Mitte',
        'Küstenroute',
    ];

    private const TRANSPORTERS = [
        'Tierschutzverein München e.V.',
        'Pet Travel GmbH',
        'Hundetaxi Meier',
        'Animal Transport Europe',
        'Ehrenamtliche Fahrgemeinschaft',
    ];

    /**
     * How far back the completed runs are spread.
     */
    private const HISTORY_MONTHS = 18;

    /**
     * The schedule of completed runs. The Transport row is only created once
     * the first adoption actually joins the run.
     *
     * @var list<array{at: CarbonImmutable, seats: int, taken: int, transport: ?Transport}>
     */
    private array $completedRuns = [];

    /** @var array{transport: Transport, capacity: int, taken: int}|null */
    private ?array $openRun = null;

    /** @var array{int, int} */
    private readonly array $capacityRange;

    /**
     * @param  Collection<int, Person>  $responsibles  mediators who can organise a run
     * @param  array{int, int}  $capacityRange  how many adoptions share one run
     */
    public function __construct(
        private readonly Generator $faker,
        private readonly Collection $responsibles,
        array $capacityRange = [4, 15],
    ) {
        // A run has to carry at least one animal — a minimum of zero would
        // let runSizes() hand out empty runs forever — and a maximum below
        // the minimum is not a range at all. The bounds come from a profile
        // that --set can write anything into, so settle them here, once, for
        // everything that reads them.
        $minimum = max(1, $capacityRange[0] ?? 1);

        $this->capacityRange = [$minimum, max($minimum, $capacityRange[1] ?? $minimum)];
    }

    /**
     * Works out the runs the given number of adoptions need, before any of
     * them is built.
     *
     * A run never ends up with fewer animals than the range's lower bound: a
     * remainder too small to be a run of its own is folded into the one before
     * it. The only exception is having fewer adoptions in total than that —
     * then there is a single, smaller run.
     */
    public function scheduleCompletedRuns(int $adoptions): void
    {
        $this->completedRuns = [];

        if ($adoptions < 1) {
            return;
        }

        $seats = $this->runSizes($adoptions);

        foreach ($this->spreadOverHistory(count($seats)) as $index => $at) {
            $this->completedRuns[] = ['at' => $at, 'seats' => $seats[$index], 'taken' => 0, 'transport' => null];
        }
    }

    /**
     * How the given adoptions divide into runs.
     *
     * Every run holds between the range's two bounds. What makes that awkward
     * is the end of the list: taking the largest run possible each time can
     * leave a remainder too small to be a run at all. So a run only takes as
     * much as it can while still leaving a full run's worth behind, and the
     * last one takes what is left.
     *
     * Two cases cannot honour both bounds, and both end in a single run that
     * breaks one of them: fewer adoptions than a run holds, and a range so
     * narrow that what is left over fits neither into this run nor into one
     * of its own. Where they conflict the minimum wins, since a run carrying
     * one animal is the thing worth avoiding.
     *
     * @return list<int>
     */
    public function runSizes(int $adoptions): array
    {
        [$minimum, $maximum] = $this->capacityRange;

        $sizes = [];
        $left = $adoptions;

        while ($left > 0) {
            if ($left <= $maximum) {
                $sizes[] = $left;

                break;
            }

            // Take as much as possible while still leaving a full run behind.
            $ceiling = min($maximum, $left - $minimum);

            if ($ceiling < $minimum) {
                $sizes[] = $left;

                break;
            }

            $sizes[] = $this->faker->numberBetween($minimum, $ceiling);
            $left -= end($sizes);
        }

        return $sizes;
    }

    /**
     * When the run the next adoption would join arrived, so the caller can
     * pick an animal the shelter already had by then.
     */
    public function nextCompletedRunAt(): ?CarbonImmutable
    {
        $index = $this->nextCompletedRunIndex();

        return $index === null ? null : $this->completedRuns[$index]['at'];
    }

    /**
     * Puts one adoption on that run, creating it on first use.
     */
    public function takeCompletedRun(): ?Transport
    {
        $index = $this->nextCompletedRunIndex();

        if ($index === null) {
            return null;
        }

        $this->completedRuns[$index]['transport'] ??= $this->createCompletedRun($this->completedRuns[$index]['at']);
        $this->completedRuns[$index]['taken']++;

        return $this->completedRuns[$index]['transport'];
    }

    /**
     * The first run with a seat left. More adoptions can turn up than were
     * scheduled, so the schedule grows a run rather than turning them away.
     */
    private function nextCompletedRunIndex(): ?int
    {
        foreach ($this->completedRuns as $index => $run) {
            if ($run['taken'] < $run['seats']) {
                return $index;
            }
        }

        if ($this->completedRuns === []) {
            return null;
        }

        $this->completedRuns[] = [
            'at' => $this->spreadOverHistory(1)[0],
            'seats' => $this->capacityRange[0],
            'taken' => 0,
            'transport' => null,
        ];

        return array_key_last($this->completedRuns);
    }

    /**
     * Arrival dates spread over the months the adoptions cover, oldest first.
     * The newest stops short of today so a handover still has room after it.
     *
     * @return list<CarbonImmutable>
     */
    private function spreadOverHistory(int $runs): array
    {
        $until = CarbonImmutable::now()->subWeek();
        $from = $until->subMonths(self::HISTORY_MONTHS);

        $slice = max(1, intdiv((int) abs($until->diffInSeconds($from)), max(1, $runs)));

        $dates = [];

        for ($index = 0; $index < $runs; $index++) {
            $dates[] = $from->addSeconds($index * $slice + $this->faker->numberBetween(0, $slice - 1));
        }

        return $dates;
    }

    private function createCompletedRun(CarbonImmutable $arrivedAt): Transport
    {
        $transport = $this->create(
            plannedAt: $arrivedAt,
            name: $this->faker->randomElement(self::TOUR_NAMES),
            notes: $this->faker->randomElement([
                'Transport verlief reibungslos. Alle Tiere gut angekommen.',
                'Ankunft mit leichter Verspätung, allen Tieren geht es gut.',
                'Zwischenstopp in Nürnberg, danach ohne Vorkommnisse.',
                '',
            ]),
        );

        $transport->done_at = $arrivedAt;
        $transport->save();

        return $transport;
    }

    /**
     * Clears out the runs that never filled up.
     *
     * The schedule is drawn from the stages before any adoption is written,
     * and some of them do not make it that far: an applicant whose inspection
     * is still open, or an animal the shelter did not have yet, steps the
     * adoption back to the contract and leaves its seat unused. A run left
     * below its minimum is not a run worth showing, so it is dropped and the
     * few adoptions on it simply have no transport — an adopter collecting
     * the animal themselves is a perfectly ordinary adoption.
     *
     * A single run is kept whatever its size: with fewer adoptions than fill
     * one, a smaller run is the best there is.
     */
    public function dropUnderfilledRuns(): void
    {
        $created = array_filter(array_column($this->completedRuns, 'transport'));

        if (count($created) < 2) {
            return;
        }

        foreach ($created as $transport) {
            if ($transport->adoptions()->count() >= $this->capacityRange[0]) {
                continue;
            }

            $transport->adoptions()->update(['transport_id' => null]);
            $transport->delete();
        }
    }

    /**
     * The next run that has not happened yet. Its planned date lies in the
     * future — the transport UI rejects a past date on an open run.
     */
    public function openRun(): Transport
    {
        if ($this->openRun !== null && $this->openRun['taken'] < $this->openRun['capacity']) {
            $this->openRun['taken']++;

            return $this->openRun['transport'];
        }

        $transport = $this->newOpenRun();

        $this->openRun = [
            'transport' => $transport,
            'capacity' => $this->faker->numberBetween(...$this->capacityRange),
            'taken' => 1,
        ];

        return $transport;
    }

    /**
     * An upcoming run nothing is booked on yet, so the transport list also
     * shows empty runs.
     */
    public function newOpenRun(): Transport
    {
        return $this->create(
            plannedAt: CarbonImmutable::now()->addDays($this->faker->numberBetween(3, 70)),
            name: $this->faker->boolean(60) ? $this->faker->randomElement(self::TOUR_NAMES) : '',
            notes: $this->faker->randomElement([
                'Bitte Abholzeit bis Freitag bestätigen.',
                'Noch Plätze frei.',
                'Route steht, Fahrer wird noch gesucht.',
                '',
            ]),
        );
    }

    private function create(CarbonImmutable $plannedAt, string $name, string $notes): Transport
    {
        return Transport::create([
            'name' => $name,
            'planned_at' => $plannedAt->toDateString(),
            'notes' => $notes,
            'responsible_id' => SeedRandom::pick($this->responsibles)?->id,
            'transporter' => $this->faker->boolean(70) ? $this->faker->randomElement(self::TRANSPORTERS) : '',
        ]);
    }
}
