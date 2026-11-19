<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('animals', function (Blueprint $table) {
            // ISO 3166-1 alpha-2 code of the country the animal currently
            // lives in. The default only fills existing rows; new animals get
            // '' from the model like every other string field.
            $table->string('current_country', 2)->default('')->after('current_location');
        });
    }

    public function down(): void
    {
        Schema::table('animals', function (Blueprint $table) {
            $table->dropColumn('current_country');
        });
    }
};
