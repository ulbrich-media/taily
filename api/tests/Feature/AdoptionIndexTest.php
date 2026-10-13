<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Taily\Enums\ContractSigningStatus;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\Person;
use Taily\Models\PreInspection;
use Taily\Models\Transport;
use Taily\Models\User;
use Taily\Tests\TestCase;

class AdoptionIndexTest extends TestCase
{
    use RefreshDatabase;

    private AnimalType $dogs;

    protected function setUp(): void
    {
        parent::setUp();

        $this->dogs = AnimalType::create(['title' => 'Hund']);
    }

    private function person(string $first, string $last): Person
    {
        return Person::create([
            'first_name' => $first,
            'last_name' => $last,
            'email' => strtolower("{$first}.{$last}@example.com"),
        ]);
    }

    private function animal(string $name, ?AnimalType $type = null): Animal
    {
        return Animal::create([
            'animal_type_id' => ($type ?? $this->dogs)->id,
            'name' => $name,
            'gender' => 'male',
        ]);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function adoption(array $attributes = [], ?Animal $animal = null, ?Person $applicant = null, ?Person $mediator = null): Adoption
    {
        return Adoption::create(array_merge([
            'animal_id' => ($animal ?? $this->animal('Bello'))->id,
            'applicant_id' => ($applicant ?? $this->person('Anna', 'Adopter'))->id,
            'mediator_id' => $mediator?->id,
        ], $attributes));
    }

    private function signingProcess(Adoption $adoption, ContractSigningStatus $status): void
    {
        $adoption->contractSigningProcesses()->create([
            'template_key' => 'default',
            'unsigned_document_hash' => 'hash',
            'status' => $status,
        ]);
    }

    private function list(string $query = ''): TestResponse
    {
        $user = User::query()->first() ?? User::factory()->create([
            'name' => 'Tester',
            'email' => 'tester@example.com',
        ]);

        return $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->getJson('/internal/adoptions'.($query === '' ? '' : "?{$query}"));
    }

    /**
     * @return list<string>
     */
    private function ids(TestResponse $response): array
    {
        $response->assertOk();

        return array_column($response->json('data'), 'id');
    }

    public function test_paginates_and_reports_totals(): void
    {
        foreach (range(1, 5) as $i) {
            $this->adoption();
        }

        $response = $this->list('per_page=2&page=3');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total', 5)
            ->assertJsonPath('meta.last_page', 3)
            ->assertJsonPath('meta.current_page', 3)
            ->assertJsonPath('meta.per_page', 2);
    }

    public function test_defaults_to_newest_first(): void
    {
        $old = $this->adoption();
        $old->forceFill(['created_at' => now()->subDays(2)])->save();
        $new = $this->adoption();

        $this->assertSame([$new->id, $old->id], $this->ids($this->list()));
    }

    public function test_per_page_zero_only_counts_the_filtered_query(): void
    {
        $this->adoption(['status' => 'pending']);
        $this->adoption(['status' => 'done']);
        $this->adoption(['status' => 'done']);

        $this->list('per_page=0')
            ->assertOk()
            ->assertJsonPath('data', [])
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('meta.per_page', 0);

        $this->list('per_page=0&filter[status]=done')
            ->assertOk()
            ->assertJsonPath('data', [])
            ->assertJsonPath('meta.total', 2);
    }

    public function test_filters_by_multiple_statuses(): void
    {
        $pending = $this->adoption(['status' => 'pending']);
        $inProgress = $this->adoption(['status' => 'in_progress']);
        $this->adoption(['status' => 'canceled']);
        $this->adoption(['status' => 'done']);

        $ids = $this->ids($this->list('filter[status]=pending,in_progress'));

        $this->assertEqualsCanonicalizing([$pending->id, $inProgress->id], $ids);
    }

    public function test_filters_by_mediator_or_by_missing_mediator(): void
    {
        $maria = $this->person('Maria', 'Vermittlerin');
        $withMaria = $this->adoption(mediator: $maria);
        $this->adoption(mediator: $this->person('Paul', 'Vermittler'));
        $without = $this->adoption();

        $this->assertSame([$withMaria->id], $this->ids($this->list("filter[mediator_id]={$maria->id}")));
        $this->assertSame([$without->id], $this->ids($this->list('filter[mediator_id]=none')));
    }

    public function test_filters_by_animal_type(): void
    {
        $cats = AnimalType::create(['title' => 'Katze']);
        $this->adoption();
        $cat = $this->adoption(animal: $this->animal('Minka', $cats));

        $this->assertSame([$cat->id], $this->ids($this->list("filter[animal_type_id]={$cats->id}")));
    }

    public function test_search_matches_applicant_full_name_in_any_order(): void
    {
        $anna = $this->adoption(applicant: $this->person('Anna', 'Müller'));
        $this->adoption(applicant: $this->person('Paul', 'Schmidt'));

        $this->assertSame([$anna->id], $this->ids($this->list('search=Anna Müller')));
        $this->assertSame([$anna->id], $this->ids($this->list('search=müller anna')));
        $this->assertSame([$anna->id], $this->ids($this->list('search=nna')));
    }

    public function test_search_matches_animal_name(): void
    {
        $rex = $this->adoption(animal: $this->animal('Rex vom Hof'));
        $this->adoption(animal: $this->animal('Bello'));

        $this->assertSame([$rex->id], $this->ids($this->list('search=rex vom')));
    }

    public function test_search_does_not_match_the_mediator(): void
    {
        $this->adoption(mediator: $this->person('Maria', 'Vermittlerin'));

        $this->assertSame([], $this->ids($this->list('search=Vermittlerin')));
    }

    public function test_search_escapes_like_wildcards(): void
    {
        $this->adoption(animal: $this->animal('Bello'));

        $this->assertSame([], $this->ids($this->list('search=%')));
        $this->assertSame([], $this->ids($this->list('search=B_llo')));
    }

    public function test_search_and_filters_combine(): void
    {
        $this->adoption(['status' => 'done'], animal: $this->animal('Rex'));
        $match = $this->adoption(['status' => 'pending'], animal: $this->animal('Rexi'));

        $this->assertSame([$match->id], $this->ids($this->list('search=rex&filter[status]=pending')));
    }

    public function test_sorts_by_related_names(): void
    {
        $zeta = $this->adoption(animal: $this->animal('Zeta'), applicant: $this->person('Anna', 'Berg'));
        $alpha = $this->adoption(animal: $this->animal('Alpha'), applicant: $this->person('Zoe', 'Adler'));

        $this->assertSame([$alpha->id, $zeta->id], $this->ids($this->list('sort=animal_name')));
        $this->assertSame([$zeta->id, $alpha->id], $this->ids($this->list('sort=-animal_name')));
        $this->assertSame([$alpha->id, $zeta->id], $this->ids($this->list('sort=applicant_name')));
    }

    public function test_step_status_filters_agree_with_the_status_accessors(): void
    {
        $adoptions = $this->stepStateAdoptions();

        $loaded = Adoption::with(['animal', 'transport', 'preInspections', 'latestContractSigningProcess'])->get();

        $steps = [
            'pre_inspection_status' => ['not_started', 'pending', 'finished'],
            'contract_status' => ['not_started', 'pending', 'finished'],
            'transport_status' => ['not_started', 'pending', 'finished'],
            'handover_status' => ['not_started', 'finished'],
        ];

        foreach ($steps as $step => $statuses) {
            foreach ($statuses as $status) {
                $expected = $loaded->filter(fn (Adoption $a) => $a->{$step} === $status)->pluck('id')->all();

                $this->assertNotEmpty($expected, "Fixture is missing {$step}={$status}");
                $this->assertEqualsCanonicalizing(
                    $expected,
                    $this->ids($this->list("filter[{$step}]={$status}&per_page=100")),
                    "{$step}={$status} does not match the accessor",
                );
            }
        }

        $this->assertCount(count($adoptions), $loaded);
    }

    public function test_step_status_filters_or_within_a_step_and_across_steps(): void
    {
        $this->stepStateAdoptions();
        $loaded = Adoption::with(['animal', 'transport', 'preInspections', 'latestContractSigningProcess'])->get();

        $either = $loaded->filter(fn (Adoption $a) => in_array($a->contract_status, ['pending', 'finished'], true))
            ->pluck('id')->all();
        $this->assertEqualsCanonicalizing(
            $either,
            $this->ids($this->list('filter[contract_status]=pending,finished&per_page=100')),
        );

        $both = $loaded->filter(fn (Adoption $a) => $a->contract_status === 'finished' && $a->transport_status === 'finished')
            ->pluck('id')->all();
        $this->assertEqualsCanonicalizing(
            $both,
            $this->ids($this->list('filter[contract_status]=finished&filter[transport_status]=finished&per_page=100')),
        );
    }

    public function test_pre_inspection_status_only_considers_the_animals_type_of_the_applicants_inspections(): void
    {
        $cats = AnimalType::create(['title' => 'Katze']);
        $applicant = $this->person('Anna', 'Adopter');
        $dogAdoption = $this->adoption(animal: $this->animal('Bello'), applicant: $applicant);

        $inspection = PreInspection::create(['person_id' => $applicant->id, 'animal_type_id' => $cats->id]);

        $this->assertSame('not_started', $dogAdoption->fresh()->pre_inspection_status);
        $this->assertSame([$dogAdoption->id], $this->ids($this->list('filter[pre_inspection_status]=not_started')));
        $this->assertSame([], $this->ids($this->list('filter[pre_inspection_status]=pending')));

        $inspection->forceFill(['submitted_at' => now()])->save();
        $this->assertSame([$dogAdoption->id], $this->ids($this->list('filter[pre_inspection_status]=not_started')));
    }

    public function test_rejects_invalid_query_parameters(): void
    {
        $this->list('filter[unknown]=1')->assertUnprocessable()->assertJsonValidationErrors('filter.unknown');
        $this->list('filter[status]=archived')->assertUnprocessable()->assertJsonValidationErrors('filter.status.0');
        $this->list('filter[handover_status]=pending')->assertUnprocessable();
        $this->list('filter[mediator_id]=someone')->assertUnprocessable()->assertJsonValidationErrors('filter.mediator_id');
        $this->list('sort=status')->assertUnprocessable()->assertJsonValidationErrors('sort');
        $this->list('per_page=101')->assertUnprocessable()->assertJsonValidationErrors('per_page');
        $this->list('per_page=-1')->assertUnprocessable()->assertJsonValidationErrors('per_page');
    }

    /**
     * One adoption per interesting state of the four derived steps.
     *
     * @return list<Adoption>
     */
    private function stepStateAdoptions(): array
    {
        $adoptions = [];

        // Nothing started.
        $adoptions[] = $this->adoption();

        // Pre-inspection pending (one submitted, one not), contract pending.
        $applicant = $this->person('Pia', 'Pending');
        $pending = $this->adoption(applicant: $applicant);
        PreInspection::create(['person_id' => $applicant->id, 'animal_type_id' => $this->dogs->id])
            ->forceFill(['submitted_at' => now()])->save();
        PreInspection::create(['person_id' => $applicant->id, 'animal_type_id' => $this->dogs->id]);
        $this->signingProcess($pending, ContractSigningStatus::AWAITING_ADOPTER_SIGNATURE);
        $adoptions[] = $pending;

        // Pre-inspection finished, contract signed, transport assigned (pending), handed over.
        $applicant = $this->person('Fiona', 'Finished');
        $finished = $this->adoption(['contract_signed' => true, 'handed_over_at' => now()], applicant: $applicant);
        PreInspection::create(['person_id' => $applicant->id, 'animal_type_id' => $this->dogs->id])
            ->forceFill(['submitted_at' => now()])->save();
        $finished->update(['transport_id' => Transport::create(['name' => 'Fahrt'])->id]);
        $adoptions[] = $finished;

        // Contract not started again after a cancelled process; transport done.
        $cancelled = $this->adoption();
        $this->signingProcess($cancelled, ContractSigningStatus::CANCELLED);
        $done = Transport::create(['name' => 'Erledigte Fahrt']);
        $done->forceFill(['done_at' => now()])->save();
        $cancelled->update(['transport_id' => $done->id]);
        $adoptions[] = $cancelled;

        return $adoptions;
    }
}
