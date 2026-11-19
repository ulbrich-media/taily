<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Taily\Enums\TiervermittlungSpecies;
use Taily\Enums\UserRole;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\TiervermittlungListing;
use Taily\Models\User;
use Taily\Tests\TestCase;

class TiervermittlungAdminTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        config(['taily.tiervermittlung.enabled' => true]);

        $this->admin = User::factory()->create(['name' => 'Admin', 'email' => 'admin@example.com', 'role' => UserRole::ADMIN]);
    }

    public function test_an_animal_type_can_be_mapped_to_a_species(): void
    {
        $type = AnimalType::create(['title' => 'Kaninchen']);

        $this->actingAs($this->admin)
            ->withHeader('referer', 'http://localhost')
            ->putJson("/internal/animal-types/{$type->id}", ['title' => 'Kaninchen', 'tiervermittlung_species' => 'small'])
            ->assertOk()
            ->assertJsonPath('data.tiervermittlung_species', 'small');

        $this->assertSame(TiervermittlungSpecies::SMALL, $type->fresh()->tiervermittlung_species);
    }

    public function test_an_unknown_species_is_rejected(): void
    {
        $type = AnimalType::create(['title' => 'Kaninchen']);

        $this->actingAs($this->admin)
            ->withHeader('referer', 'http://localhost')
            ->putJson("/internal/animal-types/{$type->id}", ['title' => 'Kaninchen', 'tiervermittlung_species' => 'rabbit'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('tiervermittlung_species');
    }

    public function test_the_animal_detail_shows_the_export_state(): void
    {
        $animal = Animal::create([
            'animal_type_id' => AnimalType::create(['title' => 'Hund', 'tiervermittlung_species' => 'dog'])->id,
            'name' => 'Bello',
            'gender' => 'male',
            'do_publish' => true,
        ]);
        TiervermittlungListing::create([
            'animal_id' => $animal->id,
            'tier_id' => $animal->id,
            'status' => 'veroeffentlicht',
            'tv_id' => 2962437,
            'url' => 'https://www.tiervermittlung.de/cgi-bin/haustier/details.pl?IDin=2962437',
            'warnings' => ['Rasse nicht erkannt'],
        ]);

        $this->actingAs($this->admin)
            ->withHeader('referer', 'http://localhost')
            ->getJson("/internal/animals/{$animal->id}")
            ->assertOk()
            ->assertJsonPath('tiervermittlung.exclusion_reasons', [
                'Es gibt keinen Beschreibungstext.',
                'Es gibt kein Bild.',
                'Das Aufenthaltsland ist nicht angegeben.',
            ])
            ->assertJsonPath('tiervermittlung.listing.status', 'veroeffentlicht')
            ->assertJsonPath('tiervermittlung.listing.tv_id', 2962437)
            ->assertJsonPath('tiervermittlung.listing.warnings', ['Rasse nicht erkannt']);
    }

    public function test_the_current_country_takes_a_two_letter_code(): void
    {
        $animal = Animal::create([
            'animal_type_id' => AnimalType::create(['title' => 'Hund'])->id,
            'name' => 'Bello',
            'gender' => 'male',
        ]);

        $this->actingAs($this->admin)
            ->withHeader('referer', 'http://localhost')
            ->putJson("/internal/animals/{$animal->id}", ['current_country' => 'Rumänien'])
            ->assertJsonValidationErrors('current_country');

        $this->actingAs($this->admin)
            ->withHeader('referer', 'http://localhost')
            ->putJson("/internal/animals/{$animal->id}", ['current_country' => 'RO'])
            ->assertOk()
            ->assertJsonPath('data.current_country', 'RO');

        $this->actingAs($this->admin)
            ->withHeader('referer', 'http://localhost')
            ->putJson("/internal/animals/{$animal->id}", ['current_country' => ''])
            ->assertOk();

        $this->assertSame('', $animal->fresh()->current_country);
    }

    public function test_the_export_state_is_absent_while_the_export_is_disabled(): void
    {
        config(['taily.tiervermittlung.enabled' => false]);
        $animal = Animal::create([
            'animal_type_id' => AnimalType::create(['title' => 'Hund'])->id,
            'name' => 'Bello',
            'gender' => 'male',
        ]);

        $this->actingAs($this->admin)
            ->withHeader('referer', 'http://localhost')
            ->getJson("/internal/animals/{$animal->id}")
            ->assertOk()
            ->assertJsonMissingPath('tiervermittlung');
    }
}
