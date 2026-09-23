<?php

namespace Taily\Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Database\Seeders\Support\SeedMail;
use Database\Seeders\Support\SeedProfile;
use Database\Seeders\Support\SeedRandom;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\Organization;
use Taily\Models\Person;
use Taily\Models\PreInspection;
use Taily\Models\Transport;
use Taily\Tests\TestCase;
use Throwable;

/**
 * The seeder is a development tool, but the data it produces is what every
 * manual check of the app is judged against. These tests hold it to the rules
 * the domain actually has: steps happen in order, and a record never
 * contradicts the records it points at.
 */
class SeederIntegrityTest extends TestCase
{
    use RefreshDatabase;

    /**
     * The data set these checks run over changes every run, because an
     * invariant that only holds for one draw is not an invariant. The seed is
     * reported when something fails, so the draw that broke can be replayed
     * with SEEDER_TEST_SEED=<seed>.
     */
    private int $seed = 0;

    private SeedProfile $profile;

    protected function setUp(): void
    {
        parent::setUp();

        // The real seeder, through the profile the command would use — only
        // without pictures, since attaching media runs the image conversions
        // inline and has nothing to do with what these tests check, and with
        // enough adoptions that every step of the process is reached on any
        // draw. Twenty of them leave the transport steps empty now and then.
        $this->profile = SeedProfile::resolve('dev', [
            'media.people' => 0,
            'media.animals' => 0,
            'adoptions' => 60,
            'animals.dogs' => 60,
            'animals.cats' => 30,
        ]);

        $this->app->instance(SeedProfile::class, $this->profile);

        $this->seed = (int) (getenv('SEEDER_TEST_SEED') ?: random_int(1, PHP_INT_MAX));

        SeedRandom::seed($this->seed);

        $this->seed(DatabaseSeeder::class);
    }

    /**
     * Says which draw failed, so it can be looked at rather than guessed at.
     */
    protected function onNotSuccessfulTest(Throwable $t): never
    {
        // PHPUnit has already recorded the failure by the time this runs, so
        // the hint goes to the output rather than into the message.
        fwrite(STDERR, sprintf(
            "\n[%s] replay this data set with SEEDER_TEST_SEED=%d\n",
            $this->name(),
            $this->seed,
        ));

        throw $t;
    }

    public function test_the_profile_decides_how_much_gets_seeded(): void
    {
        $this->assertSame($this->profile->int('organizations'), Organization::count());
        $this->assertSame($this->profile->int('people'), Person::count());
        $this->assertSame(array_sum($this->profile->counts('animals')), Animal::count());
        $this->assertSame($this->profile->int('adoptions'), Adoption::count());
    }

    public function test_it_seeds_no_pictures_when_the_profile_asks_for_none(): void
    {
        $this->assertSame(0, Media::count());
    }

    public function test_no_seeded_address_can_receive_mail(): void
    {
        $addresses = Person::where('email', '!=', '')->pluck('email')
            ->merge(Organization::where('email', '!=', '')->pluck('email'));

        $this->assertNotEmpty($addresses);

        foreach ($addresses as $address) {
            $this->assertStringEndsWith('@local.local', $address);
        }
    }

    public function test_every_person_address_is_derived_from_their_name(): void
    {
        foreach (Person::where('email', '!=', '')->get() as $person) {
            $expected = SeedMail::slug($person->first_name).'.'.SeedMail::slug($person->last_name);

            $this->assertStringStartsWith($expected.'@', $person->email);
        }
    }

    public function test_an_adoption_never_gets_ahead_of_its_own_steps(): void
    {
        foreach (Adoption::with(['animal', 'transport', 'preInspections'])->get() as $adoption) {
            $label = "adoption {$adoption->id} ({$adoption->status})";

            $this->assertTrue(
                $adoption->created_at->greaterThanOrEqualTo($adoption->animal->intake_date),
                "$label: applied for before the animal was taken in"
            );

            $submitted = $adoption->preInspections
                ->where('animal_type_id', $adoption->animal->animal_type_id)
                ->whereNotNull('submitted_at')
                ->max('submitted_at');

            if ($adoption->contract_signed_at && $submitted) {
                $this->assertTrue(
                    $adoption->contract_signed_at->greaterThanOrEqualTo($submitted),
                    "$label: contract signed before the inspection came back"
                );
            }

            if ($adoption->handed_over_at && $adoption->contract_signed_at) {
                $this->assertTrue(
                    $adoption->handed_over_at->greaterThanOrEqualTo($adoption->contract_signed_at),
                    "$label: handed over before the contract was signed"
                );
            }

            if ($adoption->handed_over_at && $adoption->transport?->done_at) {
                $this->assertTrue(
                    $adoption->handed_over_at->greaterThanOrEqualTo($adoption->transport->done_at),
                    "$label: handed over before the transport arrived"
                );
            }
        }
    }

    public function test_an_animal_only_travels_once_its_contract_is_signed(): void
    {
        foreach (Adoption::with('transport')->whereNotNull('transport_id')->get() as $adoption) {
            $this->assertTrue($adoption->contract_signed, "adoption {$adoption->id}: on a transport without a signed contract");

            if ($adoption->transport?->done_at) {
                $this->assertTrue(
                    $adoption->transport->done_at->greaterThanOrEqualTo($adoption->contract_signed_at),
                    "adoption {$adoption->id}: transport arrived before the contract was signed"
                );
            }
        }
    }

    /**
     * A transport is only worth organising once enough animals are ready for
     * it, and only so many fit on one — a run carrying a single animal makes
     * as little sense as one carrying forty.
     */
    public function test_a_completed_transport_carries_a_plausible_load(): void
    {
        [$minimum, $maximum] = $this->profile->range('adoptions_per_transport', [4, 15]);

        $runs = Transport::whereNotNull('done_at')->withCount('adoptions')->get();

        $this->assertNotEmpty($runs, 'expected the profile to produce completed transports');

        foreach ($runs as $run) {
            $this->assertLessThanOrEqual(
                $maximum,
                $run->adoptions_count,
                "transport {$run->id}: carries {$run->adoptions_count} animals, more than fits on one run"
            );

            // Fewer adoptions than fill one run leaves a single smaller run;
            // beyond that every run is filled to the minimum.
            if ($runs->count() === 1) {
                continue;
            }

            $this->assertGreaterThanOrEqual(
                $minimum,
                $run->adoptions_count,
                "transport {$run->id}: carries {$run->adoptions_count} animals, fewer than a run is worth"
            );
        }
    }

    public function test_every_animal_on_a_completed_run_was_already_at_the_shelter(): void
    {
        $adoptions = Adoption::with(['animal', 'transport'])
            ->whereHas('transport', fn ($query) => $query->whereNotNull('done_at'))
            ->get();

        $this->assertNotEmpty($adoptions);

        foreach ($adoptions as $adoption) {
            $this->assertTrue(
                $adoption->transport->done_at->greaterThanOrEqualTo($adoption->animal->intake_date),
                "adoption {$adoption->id}: travelled before the shelter had the animal"
            );
        }
    }

    public function test_an_upcoming_transport_is_never_planned_for_the_past(): void
    {
        foreach (Transport::whereNull('done_at')->get() as $transport) {
            $this->assertTrue(
                $transport->planned_at === null || $transport->planned_at->isFuture(),
                "transport {$transport->id}: open but planned in the past"
            );
        }
    }

    public function test_each_status_carries_the_steps_it_implies(): void
    {
        foreach (Adoption::all() as $adoption) {
            $label = "adoption {$adoption->id}";

            match ($adoption->status) {
                'pending' => $this->assertFalse(
                    $adoption->contract_signed || $adoption->transport_id !== null || $adoption->handed_over_at !== null,
                    "$label: pending but already past the application"
                ),
                'done' => $this->assertNotNull($adoption->handed_over_at, "$label: done without a handover"),
                'canceled' => $this->assertTrue(
                    $adoption->canceled_at !== null && $adoption->canceled_reason !== '',
                    "$label: canceled without a date and a reason"
                ),
                default => $this->assertNull($adoption->handed_over_at, "$label: still running but handed over"),
            };
        }
    }

    public function test_the_animal_agrees_with_the_adoption_holding_it(): void
    {
        foreach (Adoption::with('animal')->get() as $adoption) {
            $label = "adoption {$adoption->id}";

            $this->assertFalse($adoption->animal->is_deceased, "$label: on a deceased animal");
            $this->assertFalse($adoption->animal->is_boarding_animal, "$label: on a boarding animal");
            $this->assertNotSame($adoption->applicant_id, $adoption->mediator_id, "$label: applicant mediates their own adoption");

            if ($adoption->status === 'in_progress') {
                $this->assertTrue($adoption->animal->is_reserved, "$label: running but the animal is not reserved");
            }

            if ($adoption->status === 'done') {
                $this->assertSame($adoption->applicant_id, $adoption->animal->owner_id, "$label: handed over but the animal has another owner");
            }
        }
    }

    public function test_an_inspection_is_only_carried_out_by_someone_qualified_for_the_type(): void
    {
        $inspections = PreInspection::with('inspector.inspectorAnimalTypes')->get();

        $this->assertNotEmpty($inspections);

        foreach ($inspections as $inspection) {
            $this->assertNotNull($inspection->inspector, "inspection {$inspection->id}: nobody was assigned to carry it out");

            $this->assertTrue(
                $inspection->inspector->inspectorAnimalTypes->contains('id', $inspection->animal_type_id),
                "inspection {$inspection->id}: inspector does not handle this animal type"
            );

            $this->assertNotSame(
                $inspection->person_id,
                $inspection->inspector_id,
                "inspection {$inspection->id}: the applicant inspected their own home"
            );
        }
    }

    public function test_an_open_inspection_can_actually_be_opened(): void
    {
        $open = PreInspection::whereNull('submitted_at')->get();

        $reachable = $open->filter(fn (PreInspection $inspection) => $inspection->activeToken() !== null);

        // Counted rather than looped, so a run that happens to leave no
        // inspection open still makes the claim explicitly.
        $this->assertCount(
            $open->count(),
            $reachable,
            'an inspection is still open but has no access token to reach it'
        );
    }
}
