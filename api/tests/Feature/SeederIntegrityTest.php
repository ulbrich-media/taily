<?php

namespace Taily\Tests\Feature;

use Database\Seeders\AdoptionSeeder;
use Database\Seeders\AnimalSeeder;
use Database\Seeders\AnimalTypeSeeder;
use Database\Seeders\OrganizationSeeder;
use Database\Seeders\PersonSeeder;
use Database\Seeders\PreInspectionSeeder;
use Database\Seeders\Support\SeedMail;
use Database\Seeders\TransportSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\Organization;
use Taily\Models\Person;
use Taily\Models\PreInspection;
use Taily\Models\Transport;
use Taily\Tests\TestCase;

/**
 * The seeder is a development tool, but the data it produces is what every
 * manual check of the app is judged against. These tests hold it to the rules
 * the domain actually has: steps happen in order, and a record never
 * contradicts the records it points at.
 */
class SeederIntegrityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->app->singleton(SeedMail::class, fn () => new SeedMail);

        // No pictures: attaching media runs the image conversions inline and
        // has nothing to do with what these tests check.
        (new AnimalTypeSeeder)->run();
        (new OrganizationSeeder)->run(3);
        (new PersonSeeder)->run(20, 0);
        (new AnimalSeeder)->run(['dogs' => 20, 'cats' => 10], 0);
        (new AdoptionSeeder)->run(14);
        (new TransportSeeder)->run(2);
        (new PreInspectionSeeder)->run(3);
    }

    public function test_it_seeds_the_requested_amount_of_data(): void
    {
        $this->assertSame(3, Organization::count());
        $this->assertSame(20, Person::count());
        $this->assertSame(30, Animal::count());
        $this->assertSame(14, Adoption::count());
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
