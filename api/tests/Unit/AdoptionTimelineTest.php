<?php

namespace Taily\Tests\Unit;

use Carbon\CarbonImmutable;
use Database\Seeders\Support\AdoptionStage;
use Database\Seeders\Support\AdoptionTimeline;
use Faker\Factory as Faker;
use Faker\Generator;
use PHPUnit\Framework\TestCase;

class AdoptionTimelineTest extends TestCase
{
    private Generator $faker;

    protected function setUp(): void
    {
        parent::setUp();

        $this->faker = Faker::create();
    }

    /**
     * The whole point of the timeline: the steps of an adoption come out in
     * the order they happen, for every stage and every draw.
     */
    public function test_every_stage_produces_an_ordered_chain(): void
    {
        $notBefore = CarbonImmutable::now()->subYears(2);

        foreach (AdoptionStage::cases() as $stage) {
            for ($i = 0; $i < 50; $i++) {
                $timeline = AdoptionTimeline::build($stage, $notBefore, $this->faker);

                $dates = array_values(array_filter([
                    $timeline->appliedAt,
                    $timeline->inspectionCreatedAt,
                    $timeline->inspectionSubmittedAt,
                    $timeline->contractSignedAt,
                    $timeline->handedOverAt,
                    $timeline->canceledAt,
                ]));

                for ($step = 1; $step < count($dates); $step++) {
                    $this->assertTrue(
                        $dates[$step]->greaterThanOrEqualTo($dates[$step - 1]),
                        "{$stage->value}: step {$step} happens before the one preceding it"
                    );
                }
            }
        }
    }

    public function test_nothing_happens_before_the_animal_was_taken_in(): void
    {
        $intake = CarbonImmutable::now()->subMonths(3);

        for ($i = 0; $i < 50; $i++) {
            $timeline = AdoptionTimeline::build(AdoptionStage::HandedOver, $intake, $this->faker);

            $this->assertTrue($timeline->appliedAt->greaterThanOrEqualTo($intake));
        }
    }

    public function test_nothing_happens_in_the_future(): void
    {
        $now = CarbonImmutable::now();

        foreach (AdoptionStage::cases() as $stage) {
            $timeline = AdoptionTimeline::build($stage, $now->subYears(2), $this->faker);

            $this->assertTrue($timeline->lastEventAt()->lessThanOrEqualTo(CarbonImmutable::now()));
        }
    }

    public function test_the_steps_a_stage_did_not_reach_stay_empty(): void
    {
        $notBefore = CarbonImmutable::now()->subYear();

        $applied = AdoptionTimeline::build(AdoptionStage::Applied, $notBefore, $this->faker);
        $this->assertNull($applied->inspectionCreatedAt);
        $this->assertNull($applied->contractSignedAt);
        $this->assertNull($applied->handedOverAt);

        $inReview = AdoptionTimeline::build(AdoptionStage::InReview, $notBefore, $this->faker);
        $this->assertNotNull($inReview->inspectionCreatedAt);
        $this->assertNull($inReview->inspectionSubmittedAt);
        $this->assertNull($inReview->contractSignedAt);

        $handedOver = AdoptionTimeline::build(AdoptionStage::HandedOver, $notBefore, $this->faker);
        $this->assertNotNull($handedOver->contractSignedAt);
        $this->assertNotNull($handedOver->handedOverAt);
        $this->assertNull($handedOver->canceledAt);
    }

    /**
     * A transport run is scheduled before the adoptions on it are built, so
     * the steps have to arrange themselves around the arrival date.
     */
    public function test_a_booked_transport_anchors_the_steps_around_it(): void
    {
        $arrival = CarbonImmutable::now()->subMonths(4);

        for ($i = 0; $i < 50; $i++) {
            $timeline = AdoptionTimeline::build(
                AdoptionStage::HandedOver,
                $arrival->subYear(),
                $this->faker,
                $arrival,
            );

            $this->assertEquals($arrival, $timeline->transportedAt);

            $this->assertTrue(
                $timeline->contractSignedAt->lessThanOrEqualTo($arrival),
                'the contract should be signed before the animal travels'
            );
            $this->assertTrue(
                $timeline->inspectionSubmittedAt->lessThanOrEqualTo($timeline->contractSignedAt),
                'the inspection should come back before the contract is signed'
            );
            $this->assertTrue(
                $timeline->handedOverAt->greaterThanOrEqualTo($arrival),
                'the handover should follow the arrival'
            );
            $this->assertTrue(
                $timeline->handedOverAt->lessThanOrEqualTo(CarbonImmutable::now()),
                'the handover should not be in the future'
            );
        }
    }

    public function test_an_adoption_still_waiting_for_its_handover_stops_at_the_arrival(): void
    {
        $arrival = CarbonImmutable::now()->subMonths(2);

        $timeline = AdoptionTimeline::build(
            AdoptionStage::TransportDone,
            $arrival->subYear(),
            $this->faker,
            $arrival,
        );

        $this->assertEquals($arrival, $timeline->transportedAt);
        $this->assertNull($timeline->handedOverAt);
        $this->assertEquals($arrival, $timeline->lastEventAt());
    }

    /**
     * An animal taken in only days before its run leaves no room to spread the
     * paperwork out, but the order still has to hold.
     */
    public function test_a_late_arrival_still_comes_out_in_order(): void
    {
        $arrival = CarbonImmutable::now()->subDays(10);

        for ($i = 0; $i < 25; $i++) {
            $timeline = AdoptionTimeline::build(
                AdoptionStage::HandedOver,
                $arrival->subDay(),
                $this->faker,
                $arrival,
            );

            $this->assertTrue($timeline->appliedAt->lessThanOrEqualTo($timeline->contractSignedAt));
            $this->assertTrue($timeline->contractSignedAt->lessThanOrEqualTo($arrival));
            $this->assertTrue($timeline->handedOverAt->greaterThanOrEqualTo($arrival));
        }
    }
}
