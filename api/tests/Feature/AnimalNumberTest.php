<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Support\AnimalNumberGenerator;
use Taily\Tests\TestCase;

class AnimalNumberTest extends TestCase
{
    use RefreshDatabase;

    public function test_generated_numbers_use_the_readable_alphabet_and_contain_a_letter(): void
    {
        $generator = new AnimalNumberGenerator;

        for ($i = 0; $i < 200; $i++) {
            $number = $generator->generate();

            $this->assertMatchesRegularExpression('/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/', $number);
            $this->assertMatchesRegularExpression('/[A-Z]/', $number);
        }
    }

    public function test_creating_an_animal_model_without_number_generates_one_and_keeps_given_ones(): void
    {
        $type = AnimalType::create(['title' => 'Hund']);

        $generated = Animal::create(['animal_type_id' => $type->id, 'name' => 'A', 'gender' => 'male']);
        $custom = Animal::create(['animal_type_id' => $type->id, 'name' => 'B', 'gender' => 'male', 'animal_number' => 'DOG-00001']);

        $this->assertSame(6, strlen($generated->animal_number));
        $this->assertSame('DOG-00001', $custom->animal_number);
    }

    public function test_migration_backfills_empty_numbers_and_renumbers_duplicates(): void
    {
        $type = AnimalType::create(['title' => 'Hund']);
        $migration = require database_path('migrations/2026_11_21_000000_make_animal_number_unique.php');
        $migration->down();

        $first = Animal::create(['animal_type_id' => $type->id, 'name' => 'Erst', 'gender' => 'male', 'animal_number' => 'A-1']);
        $second = Animal::create(['animal_type_id' => $type->id, 'name' => 'Zweit', 'gender' => 'male', 'animal_number' => 'TMP-2']);
        $third = Animal::create(['animal_type_id' => $type->id, 'name' => 'Dritt', 'gender' => 'male', 'animal_number' => 'TMP-3']);
        DB::table('animals')->where('id', $first->id)->update(['created_at' => now()->subDays(3)]);
        DB::table('animals')->where('id', $second->id)->update(['animal_number' => 'A-1', 'created_at' => now()->subDays(2)]);
        DB::table('animals')->where('id', $third->id)->update(['animal_number' => '']);

        $migration->up();

        $this->assertSame('A-1', $first->fresh()->animal_number);
        $this->assertNotSame('A-1', $second->fresh()->animal_number);
        $this->assertMatchesRegularExpression('/^[A-Z2-9]{6}$/', $second->fresh()->animal_number);
        $this->assertMatchesRegularExpression('/^[A-Z2-9]{6}$/', $third->fresh()->animal_number);
        $this->assertSame(3, DB::table('animals')->distinct()->count('animal_number'));
    }
}
