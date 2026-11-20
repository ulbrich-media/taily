<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

    public function up(): void
    {
        $taken = [];

        // Oldest animal keeps a duplicated number; empty numbers get a new one.
        $animals = DB::table('animals')->orderBy('created_at')->orderBy('id')->get(['id', 'animal_number']);

        foreach ($animals as $animal) {
            $number = (string) $animal->animal_number;

            if ($number !== '' && ! isset($taken[$number])) {
                $taken[$number] = true;

                continue;
            }

            if ($number !== '') {
                Log::warning('Duplicate animal number renumbered', ['animal_id' => $animal->id, 'old_number' => $number]);
            }

            $new = $this->generate($taken);
            $taken[$new] = true;

            DB::table('animals')->where('id', $animal->id)->update(['animal_number' => $new]);
        }

        Schema::table('animals', function (Blueprint $table) {
            $table->unique('animal_number');
        });
    }

    public function down(): void
    {
        Schema::table('animals', function (Blueprint $table) {
            $table->dropUnique(['animal_number']);
        });
    }

    /**
     * @param  array<string, true>  $taken
     */
    private function generate(array $taken): string
    {
        do {
            $number = '';

            for ($i = 0; $i < 6; $i++) {
                $number .= self::ALPHABET[random_int(0, strlen(self::ALPHABET) - 1)];
            }
        } while (isset($taken[$number]) || ! preg_match('/[A-Z]/', $number));

        return $number;
    }
};
