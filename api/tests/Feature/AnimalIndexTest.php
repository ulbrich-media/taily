<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Attributes\DataProvider;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\Person;
use Taily\Models\User;
use Taily\Tests\TestCase;

class AnimalIndexTest extends TestCase
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

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function animal(string $name = 'Bello', array $attributes = []): Animal
    {
        return Animal::create(array_merge([
            'animal_type_id' => $this->dogs->id,
            'name' => $name,
            'gender' => 'male',
        ], $attributes));
    }

    private function adopt(Animal $animal, string $status): Adoption
    {
        return Adoption::create([
            'animal_id' => $animal->id,
            'applicant_id' => $this->person('Anna', 'Adopter'.$animal->adoptions()->count().$status)->id,
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
            ->getJson('/internal/animals'.($query === '' ? '' : "?{$query}"));
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
            $this->animal("Tier {$i}");
        }

        $this->list('per_page=2&page=3')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total', 5)
            ->assertJsonPath('meta.last_page', 3)
            ->assertJsonPath('meta.current_page', 3)
            ->assertJsonPath('meta.per_page', 2);
    }

    public function test_defaults_to_newest_first(): void
    {
        $old = $this->animal('Alt');
        $old->forceFill(['created_at' => now()->subDays(2)])->save();
        $new = $this->animal('Neu');

        $this->assertSame([$new->id, $old->id], $this->ids($this->list()));
    }

    public function test_per_page_zero_only_counts_the_filtered_query(): void
    {
        $this->animal('Eins', ['do_publish' => true]);
        $this->animal('Zwei', ['do_publish' => true]);
        $this->animal('Drei');

        $this->list('per_page=0')
            ->assertOk()
            ->assertJsonPath('data', [])
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('meta.per_page', 0);

        $this->list('per_page=0&filter[published]=1')
            ->assertOk()
            ->assertJsonPath('data', [])
            ->assertJsonPath('meta.total', 2);
    }

    public function test_rejects_unknown_filters_sorts_and_values(): void
    {
        $this->list('filter[unknown]=1')->assertUnprocessable()->assertJsonValidationErrors('filter.unknown');
        $this->list('sort=bogus')->assertUnprocessable()->assertJsonValidationErrors('sort');
        $this->list('filter[status]=sold')->assertUnprocessable();
        $this->list('filter[boarding]=0')->assertUnprocessable();
        $this->list('filter[published]=2')->assertUnprocessable();
        $this->list('filter[assigned_agent_id]=abc')->assertUnprocessable();
        $this->list('filter[animal_type_id]=abc')->assertUnprocessable();
        $this->list('per_page=101')->assertUnprocessable();
    }

    public function test_filters_by_animal_type(): void
    {
        $cats = AnimalType::create(['title' => 'Katze']);
        $this->animal('Bello');
        $cat = $this->animal('Minka', ['animal_type_id' => $cats->id]);

        $this->assertSame([$cat->id], $this->ids($this->list("filter[animal_type_id]={$cats->id}")));
    }

    public function test_status_is_derived_from_the_adoptions(): void
    {
        $open = $this->animal('Offen');
        $canceledOnly = $this->animal('Abgebrochen');
        $this->adopt($canceledOnly, 'canceled');
        $pending = $this->animal('Wartend');
        $this->adopt($pending, 'pending');
        $inProgress = $this->animal('Laufend');
        $this->adopt($inProgress, 'in_progress');
        $adopted = $this->animal('Vermittelt');
        $this->adopt($adopted, 'done');
        $this->adopt($adopted, 'pending');
        $this->adopt($adopted, 'canceled');
        $retried = $this->animal('Neuer Versuch');
        $this->adopt($retried, 'canceled');
        $this->adopt($retried, 'in_progress');

        $this->assertEqualsCanonicalizing(
            [$open->id, $canceledOnly->id],
            $this->ids($this->list('filter[status]=open')),
        );
        $this->assertEqualsCanonicalizing(
            [$pending->id, $inProgress->id, $retried->id],
            $this->ids($this->list('filter[status]=in_progress')),
        );
        $this->assertSame([$adopted->id], $this->ids($this->list('filter[status]=adopted')));
        $this->assertEqualsCanonicalizing(
            [$open->id, $canceledOnly->id, $adopted->id],
            $this->ids($this->list('filter[status]=open,adopted')),
        );
    }

    public function test_filters_by_assigned_member_or_by_none(): void
    {
        $maria = $this->person('Maria', 'Vermittlerin');
        $withMaria = $this->animal('Mit Maria', ['assigned_agent_id' => $maria->id]);
        $this->animal('Mit Paul', ['assigned_agent_id' => $this->person('Paul', 'Vermittler')->id]);
        $without = $this->animal('Ohne');

        $this->assertSame([$withMaria->id], $this->ids($this->list("filter[assigned_agent_id]={$maria->id}")));
        $this->assertSame([$without->id], $this->ids($this->list('filter[assigned_agent_id]=none')));
    }

    public function test_filters_by_yes_no_columns(): void
    {
        $yes = $this->animal('Ja', ['do_publish' => true, 'is_neutered' => true]);
        $no = $this->animal('Nein', ['do_publish' => false, 'is_neutered' => false]);

        $this->assertSame([$yes->id], $this->ids($this->list('filter[published]=1')));
        $this->assertSame([$no->id], $this->ids($this->list('filter[published]=0')));
        $this->assertSame([$yes->id], $this->ids($this->list('filter[neutered]=1')));
        $this->assertSame([$no->id], $this->ids($this->list('filter[neutered]=0')));
    }

    public function test_filters_by_boarding_and_reserved_flags(): void
    {
        $boarding = $this->animal('Pension', ['is_boarding_animal' => true]);
        $reserved = $this->animal('Reserviert', ['is_reserved' => true]);
        $this->animal('Normal');

        $this->assertSame([$boarding->id], $this->ids($this->list('filter[boarding]=1')));
        $this->assertSame([$reserved->id], $this->ids($this->list('filter[reserved]=1')));
    }

    public function test_filters_by_sponsor_internal_or_external(): void
    {
        $internal = $this->animal('Intern', ['sponsor_id' => $this->person('Sven', 'Sponsor')->id]);
        $external = $this->animal('Extern', ['sponsor_external' => 'Tierfreunde e.V.']);
        $this->animal('Ohne');

        $this->assertEqualsCanonicalizing(
            [$internal->id, $external->id],
            $this->ids($this->list('filter[has_sponsor]=1')),
        );
    }

    public function test_filters_by_image_ignoring_videos(): void
    {
        $withImage = $this->animal('Bild');
        $withImage->addMedia(UploadedFile::fake()->image('bild.jpg', 40, 30))->toMediaCollection('pictures');
        $withVideo = $this->animal('Video');
        $withVideo->addMedia(UploadedFile::fake()->create('video.mp4', 10, 'video/mp4'))->toMediaCollection('pictures');
        $none = $this->animal('Nichts');

        $this->assertSame([$withImage->id], $this->ids($this->list('filter[has_image]=1')));
        $this->assertEqualsCanonicalizing([$withVideo->id, $none->id], $this->ids($this->list('filter[has_image]=0')));
    }

    public function test_combines_filters_with_and(): void
    {
        $match = $this->animal('Treffer', ['do_publish' => true, 'is_reserved' => true]);
        $this->animal('Nur veröffentlicht', ['do_publish' => true]);
        $this->animal('Nur reserviert', ['is_reserved' => true]);

        $this->assertSame([$match->id], $this->ids($this->list('filter[published]=1&filter[reserved]=1')));
    }

    /**
     * @return array<string, array{string, array<string, string>}>
     */
    public static function searchFields(): array
    {
        return [
            'name' => ['Zebulon', ['name' => 'Zebulon']],
            'old name' => ['Fiffi', ['old_name' => 'Fiffi']],
            'animal number' => ['A-4711', ['animal_number' => 'A-4711']],
            'tasso' => ['TASSO123', ['tasso_id' => 'TASSO123']],
            'findefix' => ['FIND987', ['findefix_id' => 'FIND987']],
            'trace' => ['TRACE55', ['trace_id' => 'TRACE55']],
            'origin organization' => ['Tierhilfe Süd', ['origin_organization' => 'Tierhilfe Süd']],
            'external sponsor' => ['Tierfreunde', ['sponsor_external' => 'Tierfreunde e.V.']],
        ];
    }

    /**
     * @param  array<string, string>  $attributes
     */
    #[DataProvider('searchFields')]
    public function test_search_matches_the_column(string $term, array $attributes): void
    {
        $match = $this->animal('Gesucht', $attributes);
        $this->animal('Anderes');

        $this->assertSame([$match->id], $this->ids($this->list('search='.urlencode(strtolower($term)))));
    }

    public function test_search_matches_owner_and_sponsor_full_names_in_any_order(): void
    {
        $owned = $this->animal('Besitzer', ['owner_id' => $this->person('Anna', 'Müller')->id]);
        $sponsored = $this->animal('Pate', ['sponsor_id' => $this->person('Paul', 'Schmidt')->id]);
        $this->animal('Unbeteiligt');

        $this->assertSame([$owned->id], $this->ids($this->list('search='.urlencode('Anna Müller'))));
        $this->assertSame([$owned->id], $this->ids($this->list('search='.urlencode('müller anna'))));
        $this->assertSame([$sponsored->id], $this->ids($this->list('search='.urlencode('Schmidt Paul'))));
    }

    public function test_search_escapes_like_wildcards(): void
    {
        $literal = $this->animal('100% Hund');
        $this->animal('1000 Hund');
        $this->animal('Under_score');
        $this->animal('UnderXscore');

        $this->assertSame([$literal->id], $this->ids($this->list('search='.urlencode('100%'))));
        $this->assertCount(1, $this->ids($this->list('search=r_s')));
    }

    public function test_search_does_not_match_the_assigned_member(): void
    {
        $this->animal('Bello', ['assigned_agent_id' => $this->person('Maria', 'Vermittlerin')->id]);

        $this->assertSame([], $this->ids($this->list('search=Vermittlerin')));
    }

    /**
     * @return array<string, array{string}>
     */
    public static function sortKeys(): array
    {
        return array_combine(
            ['name', 'breed', 'color', 'created_at', 'updated_at', 'date_of_birth', 'animal_number'],
            array_map(fn (string $key) => [$key], ['name', 'breed', 'color', 'created_at', 'updated_at', 'date_of_birth', 'animal_number']),
        );
    }

    #[DataProvider('sortKeys')]
    public function test_sorts_by_every_key_in_both_directions(string $key): void
    {
        $values = [
            'name' => ['Anton', 'Berta', 'Cäsar'],
            'breed' => ['Akita', 'Boxer', 'Collie'],
            'color' => ['braun', 'grau', 'schwarz'],
            'created_at' => ['2024-01-01 10:00:00', '2024-02-01 10:00:00', '2024-03-01 10:00:00'],
            'updated_at' => ['2024-01-01 10:00:00', '2024-02-01 10:00:00', '2024-03-01 10:00:00'],
            'date_of_birth' => ['2020-01-01', '2021-01-01', '2022-01-01'],
            'animal_number' => ['A-1', 'A-2', 'A-3'],
        ][$key];

        $animals = [];
        foreach ([1, 2, 0] as $i) {
            $animals[$i] = $this->animal('Tier '.$i, ['name' => 'Tier '.$i]);
        }
        ksort($animals);

        foreach ($animals as $i => $animal) {
            $animal->forceFill([$key => $values[$i]]);
            $animal->timestamps = false;
            $animal->save();
        }

        $expected = array_map(fn (Animal $animal) => $animal->id, $animals);

        $this->assertSame($expected, $this->ids($this->list("sort={$key}")));
        $this->assertSame(array_reverse($expected), $this->ids($this->list("sort=-{$key}")));
    }

    public function test_sorting_by_age_puts_animals_without_birthdate_last_in_both_directions(): void
    {
        $unknown = $this->animal('Unbekannt');
        $young = $this->animal('Jung', ['date_of_birth' => '2023-01-01']);
        $old = $this->animal('Alt', ['date_of_birth' => '2015-01-01']);

        $this->assertSame([$old->id, $young->id, $unknown->id], $this->ids($this->list('sort=date_of_birth')));
        $this->assertSame([$young->id, $old->id, $unknown->id], $this->ids($this->list('sort=-date_of_birth')));
    }

    public function test_ties_are_ordered_by_id_so_pages_are_stable(): void
    {
        foreach (range(1, 6) as $i) {
            $this->animal("Tier {$i}", ['breed' => 'Mischling']);
        }

        $first = $this->ids($this->list('sort=breed&per_page=3&page=1'));
        $second = $this->ids($this->list('sort=breed&per_page=3&page=2'));

        $this->assertCount(6, array_unique(array_merge($first, $second)));
    }

    public function test_loading_a_page_does_not_run_queries_per_animal(): void
    {
        $this->list()->assertOk();

        foreach (range(1, 3) as $i) {
            $this->animal("Klein {$i}");
        }
        DB::flushQueryLog();
        DB::enableQueryLog();
        $this->list()->assertOk();
        $small = count(DB::getQueryLog());

        foreach (range(1, 10) as $i) {
            $this->animal("Gross {$i}");
        }
        DB::flushQueryLog();
        $this->list()->assertOk();
        $large = count(DB::getQueryLog());

        $this->assertSame($small, $large);
    }
}
