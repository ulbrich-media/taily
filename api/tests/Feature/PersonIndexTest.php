<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\Organization;
use Taily\Models\Person;
use Taily\Models\PreInspection;
use Taily\Models\User;
use Taily\Tests\TestCase;

class PersonIndexTest extends TestCase
{
    use RefreshDatabase;

    private AnimalType $dogs;

    private AnimalType $cats;

    protected function setUp(): void
    {
        parent::setUp();

        $this->dogs = AnimalType::create(['title' => 'Hund']);
        $this->cats = AnimalType::create(['title' => 'Katze']);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function person(string $first, string $last, array $attributes = []): Person
    {
        return Person::create(array_merge([
            'first_name' => $first,
            'last_name' => $last,
            'email' => strtolower("{$first}.{$last}@example.com"),
        ], $attributes));
    }

    private function adopt(Person $applicant, string $status): Adoption
    {
        $animal = Animal::create([
            'animal_type_id' => $this->dogs->id,
            'name' => 'Bello',
            'gender' => 'male',
        ]);

        return Adoption::create([
            'animal_id' => $animal->id,
            'applicant_id' => $applicant->id,
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
            ->getJson('/internal/persons'.($query === '' ? '' : "?{$query}"));
    }

    /**
     * @return list<string>
     */
    private function names(TestResponse $response): array
    {
        $response->assertOk();

        return array_column($response->json('data'), 'last_name');
    }

    public function test_without_list_parameters_the_whole_directory_is_returned(): void
    {
        foreach (range(1, 30) as $i) {
            $this->person('P', "Person{$i}");
        }

        $response = $this->list();

        // Unwrapped array, as before.
        $response->assertOk()->assertJsonCount(30);
    }

    public function test_it_paginates_and_sorts_by_name_by_default(): void
    {
        $this->person('Zoe', 'Zimmer');
        $this->person('Anna', 'Adler');
        $this->person('Max', 'Meier');

        $response = $this->list('per_page=2');

        $this->assertSame(['Adler', 'Meier'], $this->names($response));
        $response->assertJsonPath('meta.total', 3)->assertJsonPath('meta.last_page', 2);
        $this->assertSame(['Zimmer'], $this->names($this->list('per_page=2&page=2')));
    }

    public function test_per_page_zero_only_counts(): void
    {
        $this->person('Anna', 'Adler');
        $this->person('Max', 'Meier');

        $this->list('per_page=0&search=adler')
            ->assertOk()
            ->assertJsonPath('data', [])
            ->assertJsonPath('meta.total', 1);
    }

    public function test_unknown_filters_sorts_and_values_are_rejected(): void
    {
        $this->list('filter[bogus]=1')->assertUnprocessable();
        $this->list('sort=bogus')->assertUnprocessable();
        $this->list('filter[role]=boss')->assertUnprocessable();
        $this->list('filter[role]=mediator:not-a-uuid')->assertUnprocessable();
        $this->list('filter[organization_id]=nope')->assertUnprocessable();
        $this->list('filter[adoption_status]=weird')->assertUnprocessable();
        $this->list('per_page=101')->assertUnprocessable();
    }

    public function test_role_filter_with_and_without_animal_type_and_none(): void
    {
        $inspector = $this->person('Ina', 'Inspector');
        $inspector->inspectorAnimalTypes()->attach($this->dogs);
        $foster = $this->person('Frida', 'Foster');
        $foster->fosterAnimalTypes()->attach($this->cats);
        $mediator = $this->person('Mia', 'Mediator');
        $mediator->mediatorAnimalTypes()->attach([$this->dogs->id, $this->cats->id]);
        $this->person('Nora', 'None');

        $this->assertSame(['Inspector'], $this->names($this->list('filter[role]=inspector')));
        $this->assertSame(['Mediator'], $this->names($this->list("filter[role]=mediator:{$this->cats->id}")));
        $this->assertSame([], $this->names($this->list("filter[role]=inspector:{$this->cats->id}")));
        $this->assertSame(['None'], $this->names($this->list('filter[role]=none')));
        $this->assertSame(
            ['Foster', 'Inspector', 'None'],
            $this->names($this->list("filter[role]=none,inspector,foster:{$this->cats->id}"))
        );
    }

    public function test_organization_filter(): void
    {
        $organization = Organization::create([
            'name' => 'Tierhilfe',
            'email' => 'info@tierhilfe.test',
            'street_line' => '',
            'street_line_additional' => '',
            'postal_code' => '',
            'city' => '',
            'country_code' => 'DE',
        ]);
        $this->person('Anna', 'Member', ['organization_id' => $organization->id]);
        $this->person('Max', 'Free');

        $this->assertSame(['Member'], $this->names($this->list("filter[organization_id]={$organization->id}")));
        $this->assertSame(['Free'], $this->names($this->list('filter[organization_id]=none')));
    }

    public function test_adoption_and_pre_inspection_filters(): void
    {
        $running = $this->person('Rita', 'Running');
        $this->adopt($running, 'in_progress');
        $pending = $this->person('Paul', 'Pending');
        $this->adopt($pending, 'pending');
        $done = $this->person('Dora', 'Done');
        $this->adopt($done, 'done');
        $canceled = $this->person('Carl', 'Canceled');
        $this->adopt($canceled, 'canceled');
        $this->person('Nina', 'Nothing');

        PreInspection::create(['person_id' => $done->id, 'animal_type_id' => $this->dogs->id]);

        $this->assertSame(['Canceled', 'Done', 'Pending', 'Running'], $this->names($this->list('filter[has_adoptions]=1')));
        $this->assertSame(['Nothing'], $this->names($this->list('filter[has_adoptions]=0')));
        $this->assertSame(['Pending', 'Running'], $this->names($this->list('filter[adoption_status]=in_progress')));
        $this->assertSame(['Canceled', 'Done'], $this->names($this->list('filter[adoption_status]=done,canceled')));
        $this->assertSame(['Done'], $this->names($this->list('filter[has_pre_inspections]=1')));
        $this->assertSame(['Canceled', 'Nothing', 'Pending', 'Running'], $this->names($this->list('filter[has_pre_inspections]=0')));
    }

    public function test_archive_preset_combination(): void
    {
        $archived = $this->person('Ada', 'Archived');
        $this->adopt($archived, 'done');
        $helper = $this->person('Hans', 'Helper');
        $helper->mediatorAnimalTypes()->attach($this->dogs);
        $this->adopt($helper, 'done');
        $this->adopt($this->person('Ole', 'Open'), 'in_progress');

        $this->assertSame(['Archived'], $this->names($this->list('filter[role]=none&filter[adoption_status]=done,canceled')));
    }

    public function test_search_covers_name_email_role_city_and_country(): void
    {
        $this->person('Anna', 'Müller', ['email' => 'a@example.com', 'city' => 'Berlin', 'country_code' => 'DE']);
        $this->person('Max', 'Meier', ['email' => 'chef@tierhilfe.test', 'organization_role' => 'Vorstand', 'city' => 'Wien', 'country_code' => 'AT']);

        $this->assertSame(['Müller'], $this->names($this->list('search='.urlencode('müller anna'))));
        $this->assertSame(['Meier'], $this->names($this->list('search=tierhilfe')));
        $this->assertSame(['Meier'], $this->names($this->list('search=vorstand')));
        $this->assertSame(['Müller'], $this->names($this->list('search=berlin')));
        $this->assertSame(['Meier'], $this->names($this->list('search=AT')));
        $this->assertSame([], $this->names($this->list('search=100%25')));
    }

    public function test_sorting(): void
    {
        $orgB = Organization::create(['name' => 'B-Verein', 'email' => 'b@x.test', 'street_line' => '', 'street_line_additional' => '', 'postal_code' => '', 'city' => '', 'country_code' => 'DE']);
        $orgA = Organization::create(['name' => 'A-Verein', 'email' => 'a@x.test', 'street_line' => '', 'street_line_additional' => '', 'postal_code' => '', 'city' => '', 'country_code' => 'DE']);
        $one = $this->person('One', 'Alpha', ['organization_id' => $orgB->id, 'postal_code' => '20000', 'city' => 'Hamburg']);
        $two = $this->person('Two', 'Beta', ['organization_id' => $orgA->id, 'postal_code' => '10000', 'city' => 'Berlin']);
        $three = $this->person('Three', 'Gamma', ['postal_code' => '10000', 'city' => 'Aachen']);

        $one->inspectorAnimalTypes()->attach([$this->dogs->id, $this->cats->id]);
        $two->fosterAnimalTypes()->attach($this->dogs);

        $this->assertSame(['Gamma', 'Beta', 'Alpha'], $this->names($this->list('sort=-name')));
        $this->assertSame(['Gamma', 'Beta', 'Alpha'], $this->names($this->list('sort=organization')));
        $this->assertSame(['Gamma', 'Beta', 'Alpha'], $this->names($this->list('sort=city')));
        $this->assertSame(['Alpha', 'Beta', 'Gamma'], $this->names($this->list('sort=-roles')));
        $this->assertSame(['Gamma', 'Beta', 'Alpha'], $this->names($this->list('sort=roles')));
        $this->assertCount(3, $this->list('sort=-created_at')->json('data'));
        $this->assertCount(3, $this->list('sort=updated_at')->json('data'));
        $this->assertSame($three->id, $this->list('sort=city')->json('data.0.id'));
    }

    public function test_roles_come_from_the_loaded_animal_types(): void
    {
        $person = $this->person('Mia', 'Mediator');
        $person->mediatorAnimalTypes()->attach($this->dogs);
        $person->fosterAnimalTypes()->attach($this->dogs);

        $this->assertSame(['Pflegestelle', 'Vermittler'], $this->list('per_page=5')->json('data.0.roles'));
        $this->assertSame(['Pflegestelle', 'Vermittler'], $person->fresh()->roles);
    }
}
