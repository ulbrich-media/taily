<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('animal_traits', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('animal_id')->constrained()->cascadeOnDelete();
            $table->string('type', 64);
            $table->string('value', 255);
            $table->timestamps();
            $table->index(['animal_id', 'type']);
            $table->unique(['animal_id', 'type', 'value']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('animal_traits');
    }
};
