<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('animal_types', function (Blueprint $table) {
            // One of TiervermittlungSpecies; null keeps the type out of the export.
            $table->string('tiervermittlung_species')->nullable()->after('title');
        });

        Schema::create('tiervermittlung_listings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            // Nulled when the animal is deleted, so the export can still
            // remove the listing by its tier_id afterwards.
            $table->foreignUuid('animal_id')->nullable()->unique()->constrained('animals')->nullOnDelete();
            $table->string('tier_id', 64)->unique();
            $table->string('status')->default('');
            $table->unsignedBigInteger('tv_id')->nullable();
            $table->string('url', 2048)->default('');
            $table->string('payload_hash', 64)->default('');
            $table->json('reasons')->nullable();
            $table->json('warnings')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamp('last_sent_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tiervermittlung_listings');

        Schema::table('animal_types', function (Blueprint $table) {
            $table->dropColumn('tiervermittlung_species');
        });
    }
};
