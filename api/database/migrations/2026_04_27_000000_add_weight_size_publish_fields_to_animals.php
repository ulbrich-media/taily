<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('animals', function (Blueprint $table) {
            $table->unsignedInteger('weight_grams')->nullable()->after('color');
            $table->unsignedInteger('size_cm')->nullable()->after('weight_grams');
            $table->text('publish_description')->nullable()->after('do_publish');
            $table->string('application_url')->nullable()->after('publish_description');
        });
    }

    public function down(): void
    {
        Schema::table('animals', function (Blueprint $table) {
            $table->dropColumn(['weight_grams', 'size_cm', 'publish_description', 'application_url']);
        });
    }
};
