<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\Person;
use Taily\Models\User;
use Taily\Tests\TestCase;

class AdoptionListQueryCountTest extends TestCase
{
    use RefreshDatabase;

    private AnimalType $dogs;

    protected function setUp(): void
    {
        parent::setUp();

        $this->dogs = AnimalType::create(['title' => 'Hund']);
    }

    private function user(): User
    {
        return User::factory()->create(['name' => 'Tester', 'email' => 'tester@example.com']);
    }

    private function createAdoptions(int $count, int $offset = 0): void
    {
        for ($i = $offset; $i < $offset + $count; $i++) {
            $applicant = Person::create([
                'first_name' => "Applicant{$i}",
                'last_name' => 'Test',
                'email' => "applicant{$i}@example.com",
            ]);
            $mediator = Person::create([
                'first_name' => "Mediator{$i}",
                'last_name' => 'Test',
                'email' => "mediator{$i}@example.com",
            ]);
            $animal = Animal::create([
                'animal_type_id' => $this->dogs->id,
                'name' => "Animal{$i}",
                'gender' => 'male',
            ]);

            Adoption::create([
                'animal_id' => $animal->id,
                ...Adoption::applicantDataFrom($applicant),
                'applicant_person_id' => $applicant->id,
                'mediator_id' => $mediator->id,
            ]);
        }
    }

    /**
     * @return array{int, array<string, mixed>}
     */
    private function listWithQueryCount(User $user): array
    {
        DB::flushQueryLog();
        DB::enableQueryLog();

        $response = $this->actingAs($user)
            ->withHeader('referer', 'http://localhost')
            ->getJson('/internal/adoptions?per_page=50');

        $count = count(DB::getQueryLog());
        DB::disableQueryLog();

        $response->assertOk();

        return [$count, $response->json()];
    }

    public function test_query_count_does_not_grow_with_the_number_of_adoptions(): void
    {
        $user = $this->user();

        $this->createAdoptions(2);
        [$small, $smallBody] = $this->listWithQueryCount($user);

        $this->createAdoptions(3, 2);
        [$large, $largeBody] = $this->listWithQueryCount($user);

        $this->assertCount(2, $smallBody['data']);
        $this->assertCount(5, $largeBody['data']);
        $this->assertSame($small, $large);
    }

    public function test_nested_people_do_not_include_roles(): void
    {
        $user = $this->user();
        $this->createAdoptions(1);

        [, $body] = $this->listWithQueryCount($user);

        $this->assertNotEmpty($body['data'][0]['mediator']);
        $this->assertArrayNotHasKey('roles', $body['data'][0]['mediator']);
        $this->assertArrayNotHasKey('roles', $body['data'][0]['applicant_person']);
    }
}
