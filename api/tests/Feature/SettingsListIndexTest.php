<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Taily\Enums\UserRole;
use Taily\Models\AnimalType;
use Taily\Models\FormTemplate;
use Taily\Models\MedicalTest;
use Taily\Models\Organization;
use Taily\Models\Person;
use Taily\Models\User;
use Taily\Models\Vaccination;
use Taily\Tests\TestCase;

/**
 * List-view contract of the users, vaccinations, medical tests, organizations,
 * animal types and form templates lists.
 */
class SettingsListIndexTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'role' => UserRole::ADMIN,
        ]);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function user(string $name, array $attributes = []): User
    {
        return User::factory()->create([
            'name' => $name,
            'email' => strtolower($name).'@example.com',
            ...$attributes,
        ]);
    }

    private function fetch(string $path, ?User $as = null): TestResponse
    {
        return $this->actingAs($as ?? $this->admin)
            ->withHeader('referer', 'http://localhost')
            ->getJson("/internal/{$path}");
    }

    /**
     * @return list<string>
     */
    private function names(TestResponse $response, string $key = 'name'): array
    {
        return array_column($response->json('data'), $key);
    }

    public function test_users_are_paginated_and_sorted_by_name_by_default(): void
    {
        User::factory()->create(['name' => 'Zora', 'email' => 'zora@example.com']);
        User::factory()->create(['name' => 'Anna', 'email' => 'anna@example.com']);

        $response = $this->fetch('users?per_page=2');

        $response->assertOk()->assertJsonPath('meta.total', 3)->assertJsonPath('meta.last_page', 2);
        $this->assertSame(['Admin', 'Anna'], $this->names($response));
    }

    public function test_users_without_list_parameters_still_return_the_plain_list(): void
    {
        $this->user('One');
        $this->user('Two');

        $this->assertCount(3, $this->fetch('users')->assertOk()->json());
    }

    public function test_users_per_page_zero_only_counts(): void
    {
        $this->user('One');
        $this->user('Two');

        $this->fetch('users?per_page=0')
            ->assertOk()
            ->assertJsonPath('data', [])
            ->assertJsonPath('meta.total', 3);
    }

    public function test_users_search_covers_user_and_linked_person(): void
    {
        $person = Person::create(['first_name' => 'Marta', 'last_name' => 'Schmidt', 'email' => 'marta@shelter.test']);
        User::factory()->create(['name' => 'Login One', 'email' => 'one@example.com', 'person_id' => $person->id]);
        User::factory()->create(['name' => 'Login Two', 'email' => 'two@example.com']);

        $this->assertSame(['Login One'], $this->names($this->fetch('users?search=schmidt marta')));
        $this->assertSame(['Login One'], $this->names($this->fetch('users?search=shelter.test')));
        $this->assertSame(['Login Two'], $this->names($this->fetch('users?search=two@')));
        $this->assertSame(['Login Two'], $this->names($this->fetch('users?search=Login Two')));
    }

    public function test_users_filter_by_role_person_two_factor_and_login(): void
    {
        $person = Person::create(['first_name' => 'Marta', 'last_name' => 'Schmidt']);
        $linked = $this->user('Linked', ['person_id' => $person->id]);
        $linked->forceFill(['two_factor_confirmed_at' => now(), 'last_login_at' => now()])->save();
        $this->user('Plain');

        $this->assertSame(['Admin'], $this->names($this->fetch('users?filter[role]=admin')));
        $this->assertSame(['Linked'], $this->names($this->fetch('users?filter[has_person]=1')));
        $this->assertSame(['Admin', 'Plain'], $this->names($this->fetch('users?filter[has_person]=0')));
        $this->assertSame(['Linked'], $this->names($this->fetch('users?filter[has_two_factor]=1')));
        $this->assertSame(['Admin', 'Plain'], $this->names($this->fetch('users?filter[has_two_factor]=0')));
        $this->assertSame(['Linked'], $this->names($this->fetch('users?filter[has_logged_in]=1')));
        $this->assertSame(['Admin', 'Plain'], $this->names($this->fetch('users?filter[has_logged_in]=0')));
        $this->assertSame(['Admin', 'Linked', 'Plain'], $this->names($this->fetch('users?filter[role]=admin,user')));
    }

    public function test_users_sort_by_last_login_puts_never_logged_in_last(): void
    {
        $this->user('Old', ['last_login_at' => now()->subDays(5)]);
        $this->user('New', ['last_login_at' => now()->subDay()]);

        $this->assertSame(['Old', 'New', 'Admin'], $this->names($this->fetch('users?sort=last_login_at')));
        $this->assertSame(['New', 'Old', 'Admin'], $this->names($this->fetch('users?sort=-last_login_at')));
    }

    public function test_users_reject_unknown_sort_and_filter(): void
    {
        $this->fetch('users?sort=password')->assertUnprocessable();
        $this->fetch('users?filter[nope]=1')->assertUnprocessable();
        $this->fetch('users?filter[role]=owner')->assertUnprocessable();
    }

    public function test_non_admins_cannot_filter_or_sort_by_security_state(): void
    {
        $user = $this->user('Regular');

        $this->fetch('users?filter[has_two_factor]=0', $user)->assertUnprocessable();
        $this->fetch('users?filter[has_logged_in]=0', $user)->assertUnprocessable();
        $this->fetch('users?sort=last_login_at', $user)->assertUnprocessable();
        $this->fetch('users?sort=email', $user)->assertOk();
    }

    public function test_vaccinations_are_one_list_grouped_by_animal_type_then_title(): void
    {
        $dogs = AnimalType::create(['title' => 'Hund']);
        $cats = AnimalType::create(['title' => 'Katze']);
        Vaccination::create(['title' => 'Tollwut', 'animal_type_id' => $cats->id]);
        Vaccination::create(['title' => 'Staupe', 'animal_type_id' => $dogs->id]);
        Vaccination::create(['title' => 'Parvovirose', 'animal_type_id' => $dogs->id]);

        $response = $this->fetch('vaccinations?per_page=10');

        $response->assertOk()->assertJsonPath('meta.total', 3);
        $this->assertSame(['Parvovirose', 'Staupe', 'Tollwut'], $this->names($response, 'title'));
        $this->assertSame('Hund', $response->json('data.0.animal_type.title'));

        $filtered = $this->fetch("vaccinations?filter[animal_type_id]={$cats->id}");
        $this->assertSame(['Tollwut'], $this->names($filtered, 'title'));
    }

    public function test_vaccinations_have_a_fixed_order_and_reject_unknown_input(): void
    {
        $this->fetch('vaccinations?sort=title')->assertUnprocessable();
        $this->fetch('vaccinations?search=a')->assertUnprocessable();
        $this->fetch('vaccinations?filter[animal_type_id]=not-a-uuid')->assertUnprocessable();
        $this->fetch('vaccinations?filter[other]=1')->assertUnprocessable();
    }

    public function test_vaccinations_keep_the_legacy_animal_type_parameter(): void
    {
        $dogs = AnimalType::create(['title' => 'Hund']);
        $cats = AnimalType::create(['title' => 'Katze']);
        Vaccination::create(['title' => 'Staupe', 'animal_type_id' => $dogs->id]);
        Vaccination::create(['title' => 'Tollwut', 'animal_type_id' => $cats->id]);

        $response = $this->fetch("vaccinations?animal_type_id={$dogs->id}")->assertOk();

        $this->assertCount(1, $response->json());
    }

    public function test_medical_tests_are_one_list_grouped_by_animal_type_then_title(): void
    {
        $dogs = AnimalType::create(['title' => 'Hund']);
        $cats = AnimalType::create(['title' => 'Katze']);
        MedicalTest::create(['title' => 'FeLV', 'animal_type_id' => $cats->id]);
        MedicalTest::create(['title' => 'Giardien', 'animal_type_id' => $dogs->id]);
        MedicalTest::create(['title' => 'Leishmaniose', 'animal_type_id' => $dogs->id]);

        $response = $this->fetch('medical-tests?per_page=2&page=1');

        $response->assertOk()->assertJsonPath('meta.last_page', 2);
        $this->assertSame(['Giardien', 'Leishmaniose'], $this->names($response, 'title'));

        $this->assertSame(['FeLV'], $this->names($this->fetch("medical-tests?filter[animal_type_id]={$cats->id}"), 'title'));
    }

    public function test_organizations_search_and_are_ordered_by_name(): void
    {
        Organization::create(['name' => 'Zeta', 'email' => 'info@zeta.test', 'city' => 'Hamburg', 'country_code' => 'DE']);
        Organization::create(['name' => 'Alpha', 'email' => 'info@alpha.test', 'city' => 'Wien', 'country_code' => 'AT']);

        $all = $this->fetch('organizations?per_page=10');
        $this->assertSame(['Alpha', 'Zeta'], $this->names($all));

        $this->assertSame(['Zeta'], $this->names($this->fetch('organizations?search=hamburg')));
        $this->assertSame(['Alpha'], $this->names($this->fetch('organizations?search=AT')));
        $this->assertSame(['Zeta'], $this->names($this->fetch('organizations?search=zeta.test')));
        $this->assertSame(['Alpha'], $this->names($this->fetch('organizations?search=alp')));
        $this->fetch('organizations?sort=name')->assertUnprocessable();
    }

    public function test_organizations_search_escapes_like_wildcards(): void
    {
        Organization::create(['name' => 'Alpha']);

        $this->assertSame([], $this->names($this->fetch('organizations?search=%')));
    }

    public function test_animal_types_and_form_templates_are_paginated_by_name(): void
    {
        AnimalType::create(['title' => 'Katze']);
        AnimalType::create(['title' => 'Hund']);
        FormTemplate::create(['name' => 'Zweite']);
        FormTemplate::create(['name' => 'Erste']);

        $types = $this->fetch('animal-types?per_page=1');
        $types->assertOk()->assertJsonPath('meta.total', 2);
        $this->assertSame(['Hund'], $this->names($types, 'title'));

        $templates = $this->fetch('form-templates?per_page=10');
        $this->assertSame(['Erste', 'Zweite'], $this->names($templates));

        $this->fetch('animal-types?search=a')->assertUnprocessable();
        $this->fetch('form-templates?filter[x]=1')->assertUnprocessable();
        $this->fetch('animal-types?per_page=0')->assertJsonPath('meta.total', 2);
    }

    public function test_animal_types_without_list_parameters_keep_the_full_list(): void
    {
        AnimalType::create(['title' => 'Katze']);

        $this->fetch('animal-types')->assertOk()->assertJsonPath('count', 1);
    }
}
