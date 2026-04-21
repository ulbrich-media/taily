<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop old pivot tables first (they reference health_conditions)
        Schema::dropIfExists('animal_health_condition_vaccination');
        Schema::dropIfExists('animal_health_condition_test');
        Schema::dropIfExists('health_conditions');

        Schema::create('vaccinations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->string('description');
            $table->foreignUuid('animal_type_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('medical_tests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->string('description');
            $table->foreignUuid('animal_type_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('animal_vaccination', function (Blueprint $table) {
            $table->foreignUuid('animal_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('vaccination_id')->constrained()->cascadeOnDelete();
            $table->date('vaccinated_at')->nullable();
            $table->timestamps();

            $table->primary(['animal_id', 'vaccination_id'], 'animal_vaccination_primary');
        });

        Schema::create('animal_medical_test', function (Blueprint $table) {
            $table->foreignUuid('animal_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('medical_test_id')->constrained('medical_tests')->cascadeOnDelete();
            $table->date('tested_at')->nullable();
            $table->enum('result', ['positive', 'negative']);
            $table->timestamps();

            $table->primary(['animal_id', 'medical_test_id'], 'animal_medical_test_primary');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('animal_medical_test');
        Schema::dropIfExists('animal_vaccination');
        Schema::dropIfExists('medical_tests');
        Schema::dropIfExists('vaccinations');

        Schema::create('health_conditions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->foreignUuid('animal_type_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('animal_health_condition_vaccination', function (Blueprint $table) {
            $table->foreignUuid('animal_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('health_condition_id')->constrained()->cascadeOnDelete();
            $table->date('vaccinated_at');
            $table->timestamps();

            $table->primary(['animal_id', 'health_condition_id'], 'animal_health_condition_vaccination_primary');
        });

        Schema::create('animal_health_condition_test', function (Blueprint $table) {
            $table->foreignUuid('animal_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('health_condition_id')->constrained()->cascadeOnDelete();
            $table->date('tested_at');
            $table->enum('result', ['positive', 'negative']);
            $table->timestamps();

            $table->primary(['animal_id', 'health_condition_id'], 'animal_health_condition_test_primary');
        });
    }
};
