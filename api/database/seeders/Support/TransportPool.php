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
 * A run carries several animals, so the pool reuses one until it is full.
 * A completed run is only reused for an adoption whose own window it fits —
 * the animal cannot arrive before its contract was signed, nor after it was
 * handed over — which is why transports are built together with the adoptions
 * instead of being assigned to them afterwards.
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

    /** @var list<array{transport: Transport, done_at: CarbonImmutable, capacity: int, taken: int}> */
    private array $completedRuns = [];

    /** @var array{transport: Transport, capacity: int, taken: int}|null */
    private ?array $openRun = null;

    /**
     * @param  Collection<int, Person>  $responsibles  mediators who can organise a run
     * @param  array{int, int}  $capacityRange  how many adoptions share one run
     */
    public function __construct(
        private readonly Generator $faker,
        private readonly Collection $responsibles,
        private readonly array $capacityRange = [2, 5],
    ) {}

    /**
     * A run that already arrived, somewhere inside the given window.
     */
    public function completedRunFor(CarbonImmutable $earliest, CarbonImmutable $latest): Transport
    {
        foreach ($this->completedRuns as $index => $run) {
            if ($run['taken'] >= $run['capacity']) {
                continue;
            }

            if ($run['done_at']->betweenIncluded($earliest, $latest)) {
                $this->completedRuns[$index]['taken']++;

                return $run['transport'];
            }
        }

        $doneAt = $earliest->addSeconds($this->faker->numberBetween(0, max(0, (int) abs($latest->diffInSeconds($earliest)))));

        $transport = $this->create(
            plannedAt: $doneAt,
            name: $this->faker->randomElement(self::TOUR_NAMES),
            notes: $this->faker->randomElement([
                'Transport verlief reibungslos. Alle Tiere gut angekommen.',
                'Ankunft mit leichter Verspätung, allen Tieren geht es gut.',
                'Zwischenstopp in Nürnberg, danach ohne Vorkommnisse.',
                '',
            ]),
        );

        $transport->done_at = $doneAt;
        $transport->save();

        $this->completedRuns[] = [
            'transport' => $transport,
            'done_at' => $doneAt,
            'capacity' => $this->faker->numberBetween(...$this->capacityRange),
            'taken' => 1,
        ];

        return $transport;
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
            'responsible_id' => $this->responsibles->isNotEmpty() ? $this->responsibles->random()->id : null,
            'transporter' => $this->faker->boolean(70) ? $this->faker->randomElement(self::TRANSPORTERS) : '',
        ]);
    }
}
