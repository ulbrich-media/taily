<?php

namespace Database\Seeders\Support;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Faker\Generator;

/**
 * The dates of a single adoption, in the order the steps actually happened.
 *
 * Every date is drawn from its own slice of one window, ascending, so the
 * ordering holds by construction rather than by luck: an inspection is always
 * submitted before the contract is signed, the contract before the transport,
 * the transport before the handover.
 */
class AdoptionTimeline
{
    private const SECONDS_PER_DAY = 86400;

    private function __construct(
        public readonly CarbonImmutable $appliedAt,
        public readonly ?CarbonImmutable $inspectionCreatedAt,
        public readonly ?CarbonImmutable $inspectionSubmittedAt,
        public readonly ?CarbonImmutable $contractSignedAt,
        public readonly ?CarbonImmutable $transportedAt,
        public readonly ?CarbonImmutable $handedOverAt,
        public readonly ?CarbonImmutable $canceledAt,
    ) {}

    /**
     * @param  CarbonInterface|null  $notBefore  the earliest moment anything may happen — the
     *                                           animal's intake date, or the end of its previous
     *                                           adoption when it was listed again
     * @param  CarbonInterface|null  $transportedAt  when the animal's transport arrived, for the
     *                                               stages that have one. The run is scheduled
     *                                               before the adoption is built, so the steps are
     *                                               laid out around it: the caller is responsible
     *                                               for handing over a run the animal could
     *                                               actually have been on.
     */
    public static function build(
        AdoptionStage $stage,
        ?CarbonInterface $notBefore,
        Generator $faker,
        ?CarbonInterface $transportedAt = null,
    ): self {
        $now = CarbonImmutable::now();
        $earliest = CarbonImmutable::instance($notBefore ?? $now->subMonths(18))->min($now);

        // Everything that has to have happened by the time the animal travels.
        $leadingUp = ['applied'];

        if ($stage->hasPreInspection()) {
            $leadingUp[] = 'inspection_created';
        }

        if ($stage->preInspectionVerdict() !== null) {
            $leadingUp[] = 'inspection_submitted';
        }

        if ($stage->hasContract()) {
            $leadingUp[] = 'contract_signed';
        }

        // And what follows it.
        $following = [];

        if ($stage->isHandedOver()) {
            $following[] = 'handed_over';
        }

        if ($stage->adoptionStatus() === 'canceled') {
            $following[] = 'canceled';
        }

        $dates = $transportedAt !== null
            ? self::around(CarbonImmutable::instance($transportedAt), $earliest, $now, $leadingUp, $following, $faker)
            : self::spanning($earliest, $now, [...$leadingUp, ...$following], $faker);

        return new self(
            appliedAt: $dates['applied'],
            inspectionCreatedAt: $dates['inspection_created'] ?? null,
            inspectionSubmittedAt: $dates['inspection_submitted'] ?? null,
            contractSignedAt: $dates['contract_signed'] ?? null,
            transportedAt: $transportedAt !== null ? CarbonImmutable::instance($transportedAt) : null,
            handedOverAt: $dates['handed_over'] ?? null,
            canceledAt: $dates['canceled'] ?? null,
        );
    }

    /**
     * Lays the steps out on either side of a transport that is already booked:
     * the paperwork in the weeks before it, the handover in the days after.
     *
     * @param  list<string>  $leadingUp
     * @param  list<string>  $following
     * @return array<string, CarbonImmutable>
     */
    private static function around(
        CarbonImmutable $arrival,
        CarbonImmutable $earliest,
        CarbonImmutable $now,
        array $leadingUp,
        array $following,
        Generator $faker,
    ): array {
        $from = $arrival->subDays($faker->numberBetween(21, 120))->max($earliest)->min($arrival);

        $dates = array_combine($leadingUp, self::slots($from, $arrival, count($leadingUp), $faker));

        if ($following !== []) {
            $until = $arrival->addDays($faker->numberBetween(1, 45))->min($now)->max($arrival);

            $dates += array_combine($following, self::slots($arrival, $until, count($following), $faker));
        }

        return $dates;
    }

    /**
     * Lays the steps out over a window of their own, for an adoption with no
     * transport to anchor them.
     *
     * @param  list<string>  $steps
     * @return array<string, CarbonImmutable>
     */
    private static function spanning(
        CarbonImmutable $earliest,
        CarbonImmutable $now,
        array $steps,
        Generator $faker,
    ): array {
        // An adoption runs for weeks or months, not for the animal's whole
        // stay, so the chain gets its own window between $earliest and now.
        $available = max(1, (int) abs($now->diffInSeconds($earliest)));
        $duration = min($available, $faker->numberBetween(14, 180) * self::SECONDS_PER_DAY);

        $start = $earliest->addSeconds($faker->numberBetween(0, $available - $duration));

        return array_combine($steps, self::slots($start, $start->addSeconds($duration), count($steps), $faker));
    }

    /**
     * The last thing that happened, which is what the adoption's updated_at
     * should reflect.
     */
    public function lastEventAt(): CarbonImmutable
    {
        return $this->canceledAt
            ?? $this->handedOverAt
            ?? $this->transportedAt
            ?? $this->contractSignedAt
            ?? $this->inspectionSubmittedAt
            ?? $this->inspectionCreatedAt
            ?? $this->appliedAt;
    }

    /**
     * Splits the window into one slice per step and picks a moment in each,
     * which keeps the dates both ordered and spread out.
     *
     * Each moment is pulled into office hours, because a shelter signs
     * contracts and hands animals over during the day. It also keeps the
     * seeder clear of the hour that vanishes when the clocks go forward, which
     * a timestamp column refuses on a connection running in local time.
     *
     * @return list<CarbonImmutable>
     */
    private static function slots(CarbonImmutable $from, CarbonImmutable $to, int $count, Generator $faker): array
    {
        $span = max(1, (int) abs($to->diffInSeconds($from)));
        $slice = max(1, intdiv($span, $count));

        $slots = [];
        $previous = null;

        for ($i = 0; $i < $count; $i++) {
            $moment = $from
                ->addSeconds($i * $slice + $faker->numberBetween(0, $slice - 1))
                ->setTime($faker->numberBetween(8, 17), $faker->numberBetween(0, 59), $faker->numberBetween(0, 59));

            // Moving to office hours can pull a moment back behind the one
            // before it; give it the next free slot on the same day instead.
            if ($previous !== null && $moment->lessThanOrEqualTo($previous)) {
                $moment = $previous->addMinutes($faker->numberBetween(5, 90));
            }

            $previous = $moment->min($to)->max($from);
            $slots[] = $previous;
        }

        return $slots;
    }
}
