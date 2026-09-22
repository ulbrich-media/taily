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
        public readonly ?CarbonImmutable $handedOverAt,
        public readonly ?CarbonImmutable $canceledAt,
    ) {}

    /**
     * @param  CarbonInterface|null  $notBefore  the earliest moment anything may happen — the
     *                                           animal's intake date, or the end of its previous
     *                                           adoption when it was listed again
     */
    public static function build(AdoptionStage $stage, ?CarbonInterface $notBefore, Generator $faker): self
    {
        $now = CarbonImmutable::now();

        // Steps, in order. A transport gets a slot of its own so the handover
        // does not land right on top of the signed contract; the exact instant
        // is chosen later by the TransportPool, within the window these leave.
        $steps = ['applied'];

        if ($stage->hasPreInspection()) {
            $steps[] = 'inspection_created';
        }

        if ($stage->preInspectionVerdict() !== null) {
            $steps[] = 'inspection_submitted';
        }

        if ($stage->hasContract()) {
            $steps[] = 'contract_signed';
        }

        if ($stage->transport() === TransportState::Done) {
            $steps[] = 'transport';
        }

        if ($stage->isHandedOver()) {
            $steps[] = 'handed_over';
        }

        if ($stage->adoptionStatus() === 'canceled') {
            $steps[] = 'canceled';
        }

        // An adoption runs for weeks or months, not for the animal's whole stay,
        // so the chain gets its own window somewhere between $notBefore and now.
        $earliest = CarbonImmutable::instance($notBefore ?? $now->subMonths(18))->min($now);
        $available = max(1, (int) abs($now->diffInSeconds($earliest)));
        $duration = min($available, $faker->numberBetween(14, 180) * self::SECONDS_PER_DAY);

        $start = $earliest->addSeconds($faker->numberBetween(0, $available - $duration));

        $dates = array_combine($steps, self::slots($start, $start->addSeconds($duration), count($steps), $faker));

        return new self(
            appliedAt: $dates['applied'],
            inspectionCreatedAt: $dates['inspection_created'] ?? null,
            inspectionSubmittedAt: $dates['inspection_submitted'] ?? null,
            contractSignedAt: $dates['contract_signed'] ?? null,
            handedOverAt: $dates['handed_over'] ?? null,
            canceledAt: $dates['canceled'] ?? null,
        );
    }

    /**
     * The window a completed transport has to land in: after the contract was
     * signed, before the adopter received the animal.
     *
     * @return array{CarbonImmutable, CarbonImmutable}
     */
    public function transportWindow(): array
    {
        return [
            $this->contractSignedAt ?? $this->appliedAt,
            $this->handedOverAt ?? CarbonImmutable::now(),
        ];
    }

    /**
     * The last thing that happened, which is what the adoption's updated_at
     * should reflect.
     */
    public function lastEventAt(): CarbonImmutable
    {
        return $this->canceledAt
            ?? $this->handedOverAt
            ?? $this->contractSignedAt
            ?? $this->inspectionSubmittedAt
            ?? $this->inspectionCreatedAt
            ?? $this->appliedAt;
    }

    /**
     * Splits the window into one slice per step and picks a random point in
     * each, which keeps the dates both ordered and spread out.
     *
     * @return list<CarbonImmutable>
     */
    private static function slots(CarbonImmutable $from, CarbonImmutable $to, int $count, Generator $faker): array
    {
        $span = max(1, (int) abs($to->diffInSeconds($from)));
        $slice = max(1, intdiv($span, $count));

        $slots = [];

        for ($i = 0; $i < $count; $i++) {
            $slots[] = $from->addSeconds($i * $slice + $faker->numberBetween(0, $slice - 1));
        }

        return $slots;
    }
}
