<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\TiervermittlungListing;
use Taily\Tests\TestCase;

class CurrentCountryMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_listed_animals_keep_germany_so_their_listings_stay_online(): void
    {
        $type = AnimalType::create(['title' => 'Hund', 'tiervermittlung_species' => 'dog']);
        $listed = Animal::create(['animal_type_id' => $type->id, 'name' => 'Gelistet', 'gender' => 'male']);
        $unlisted = Animal::create(['animal_type_id' => $type->id, 'name' => 'Nicht gelistet', 'gender' => 'male']);
        TiervermittlungListing::create(['animal_id' => $listed->id, 'tier_id' => $listed->id, 'status' => 'veroeffentlicht']);

        $migration = require database_path('migrations/2026_11_19_000000_add_current_country_to_animals.php');
        $migration->down();
        $migration->up();

        $this->assertSame('DE', DB::table('animals')->where('id', $listed->id)->value('current_country'));
        $this->assertSame('', DB::table('animals')->where('id', $unlisted->id)->value('current_country'));

        $column = collect(Schema::getColumns('animals'))->firstWhere('name', 'current_country');
        $this->assertFalse($column['nullable']);
        $this->assertNull($column['default']);
    }
}
