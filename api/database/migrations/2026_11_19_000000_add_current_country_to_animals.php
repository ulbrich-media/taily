<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ISO 3166-1 alpha-2 code of the country the animal currently lives
        // in. Added as nullable so existing rows can be filled before the
        // column becomes a plain non-nullable string; new animals get '' from
        // the model like every other string field.
        Schema::table('animals', function (Blueprint $table) {
            $table->string('current_country', 2)->nullable()->after('current_location');
        });

        // Animals already listed on Tiervermittlung.de were sent with the
        // installation's location, which was Germany. Keeping that country
        // keeps their listings online; without it the next sync would
        // withdraw them.
        DB::table('animals')
            ->whereIn('id', DB::table('tiervermittlung_listings')->whereNotNull('animal_id')->select('animal_id'))
            ->update(['current_country' => 'DE']);

        DB::table('animals')->whereNull('current_country')->update(['current_country' => '']);

        Schema::table('animals', function (Blueprint $table) {
            $table->string('current_country', 2)->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('animals', function (Blueprint $table) {
            $table->dropColumn('current_country');
        });
    }
};
