<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop dependents first (use dropIfExists / conditional drops for idempotency)
        Schema::dropIfExists('form_submissions');

        $foreignKeys = DB::select("
            SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'animal_types'
              AND CONSTRAINT_TYPE = 'FOREIGN KEY'
              AND CONSTRAINT_NAME LIKE '%form_template%'
        ");
        foreach ($foreignKeys as $fk) {
            Schema::table('animal_types', function (Blueprint $table) use ($fk) {
                $table->dropForeign($fk->CONSTRAINT_NAME);
            });
        }

        Schema::dropIfExists('form_template_versions');
        Schema::dropIfExists('form_templates');

        // form_templates: stable parent entity (replaces type string as identity)
        Schema::create('form_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->timestamps();
        });

        // form_template_versions: versioned schemas
        Schema::create('form_template_versions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('form_template_id')
                ->constrained('form_templates')
                ->cascadeOnDelete();
            $table->json('schema');
            $table->json('ui_schema')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();

            $table->unique(['form_template_id', 'version']);
        });

        // Clear stale references so the new FK constraint can be applied cleanly
        DB::table('animal_types')->update(['pre_inspection_form_template_id' => null]);

        // Re-add FK on animal_types (column already exists, just add constraint)
        Schema::table('animal_types', function (Blueprint $table) {
            $table->foreign('pre_inspection_form_template_id')
                ->references('id')
                ->on('form_templates')
                ->nullOnDelete();
        });

        // form_submissions now pins to a specific version
        Schema::create('form_submissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuidMorphs('submittable');
            $table->foreignUuid('form_template_version_id')
                ->constrained('form_template_versions')
                ->restrictOnDelete();
            $table->json('data');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('form_submissions');

        Schema::table('animal_types', function (Blueprint $table) {
            $table->dropForeign(['pre_inspection_form_template_id']);
        });

        Schema::dropIfExists('form_template_versions');
        Schema::dropIfExists('form_templates');

        Schema::create('form_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->string('name');
            $table->json('schema');
            $table->json('ui_schema')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();

            $table->unique(['type', 'version']);
        });

        Schema::table('animal_types', function (Blueprint $table) {
            $table->foreign('pre_inspection_form_template_id')
                ->references('id')
                ->on('form_templates')
                ->nullOnDelete();
        });

        Schema::create('form_submissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuidMorphs('submittable');
            $table->foreignUuid('form_template_id')
                ->constrained('form_templates')
                ->restrictOnDelete();
            $table->json('data');
            $table->timestamps();
        });
    }
};
