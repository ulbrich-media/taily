<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Where the animal actually lives (e.g. a foster home). Existing rows
        // and new animals start with '' like every other string field.
        Schema::table('animals', function (Blueprint $table) {
            $table->string('current_postal_code', 16)->default('')->after('current_country');
            $table->string('current_city')->default('')->after('current_postal_code');
        });
    }

    public function down(): void
    {
        Schema::table('animals', function (Blueprint $table) {
            $table->dropColumn(['current_postal_code', 'current_city']);
        });
    }
};
