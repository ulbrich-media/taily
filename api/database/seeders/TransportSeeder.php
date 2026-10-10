<?php

namespace Database\Seeders;

use Database\Seeders\Support\TransportPool;
use Faker\Factory as Faker;
use Illuminate\Database\Seeder;
use Taily\Models\Person;

/**
 * Upcoming transport runs nothing is booked on yet, so the transport list also
 * shows empty runs a mediator can assign an adoption to.
 *
 * Runs that actually carry animals are created by AdoptionSeeder through the
 * TransportPool — their dates have to fit the adoptions travelling on them.
 */
class TransportSeeder extends Seeder
{
    public function run(int $count = 2): void
    {
        if ($count < 1) {
            return;
        }

        $faker = Faker::create('de_DE');
        $mediators = Person::whereHas('mediatorAnimalTypes')->get();

        $pool = new TransportPool($faker, $mediators);

        for ($i = 0; $i < $count; $i++) {
            $pool->newOpenRun();
        }
    }
}
