<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The adoption Case File (ADR-016, docs/features/case-file.md) and the move
 * of pre-inspections from Person + Animal Type onto the adoption.
 *
 * Taily is in beta, so existing pre-inspections — and their form submissions
 * and access tokens — are dropped rather than migrated.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('form_submissions')->where('submittable_type', 'Taily\\Models\\PreInspection')->delete();
        DB::table('access_tokens')->where('tokenable_type', 'Taily\\Models\\PreInspection')->delete();

        Schema::drop('pre_inspections');

        Schema::create('pre_inspections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('adoption_id')->constrained('adoptions')->cascadeOnDelete();
            $table->foreignUuid('inspector_id')->nullable()->constrained('people')->nullOnDelete();
            $table->enum('verdict', ['approved', 'rejected'])->nullable();
            $table->text('memo');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });

        Schema::table('animal_types', function (Blueprint $table) {
            $table->dropForeign(['pre_inspection_form_template_id']);
            $table->dropColumn('pre_inspection_form_template_id');
        });

        Schema::table('adoptions', function (Blueprint $table) {
            $table->timestamp('pre_inspection_confirmed_at')->nullable()->after('pre_inspection_notes');
            $table->foreignUuid('pre_inspection_confirmed_by')->nullable()->after('pre_inspection_confirmed_at')
                ->constrained('users')->nullOnDelete();
        });

        // Every animal type has its own catalogue (docs/features/case-file.md):
        // what is configured on "Hund" is exactly what a dog adoption asks.
        Schema::create('field_groups', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('animal_type_id')->constrained('animal_types')->cascadeOnDelete();
            $table->string('title');
            $table->text('intro');
            $table->unsignedInteger('position');
            $table->timestamps();
        });

        Schema::create('field_definitions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('animal_type_id')->constrained('animal_types')->cascadeOnDelete();
            $table->string('key');
            $table->foreignUuid('field_group_id')->constrained('field_groups')->cascadeOnDelete();
            $table->unsignedInteger('position');
            $table->string('type');
            $table->string('label');
            $table->text('help');
            $table->json('options')->nullable();
            // Set for built-in fields: the Person column (or "address") the value lives in.
            $table->string('person_attribute')->nullable();
            $table->string('collect_at');
            $table->string('required_for')->nullable();
            $table->boolean('requires_review')->default(false);
            $table->boolean('visible_to_applicant')->default(true);
            $table->boolean('visible_to_inspector')->default(true);
            $table->json('condition')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
            $table->unique(['animal_type_id', 'key']);
        });

        Schema::create('adoption_field_values', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('adoption_id')->constrained('adoptions')->cascadeOnDelete();
            $table->foreignUuid('field_definition_id')->constrained('field_definitions')->cascadeOnDelete();
            $table->json('value')->nullable();
            $table->string('review_status')->nullable();
            $table->text('review_note');
            $table->foreignUuid('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->unique(['adoption_id', 'field_definition_id']);
        });

        Schema::create('adoption_requirements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('adoption_id')->constrained('adoptions')->cascadeOnDelete();
            $table->foreignUuid('field_definition_id')->constrained('field_definitions')->cascadeOnDelete();
            $table->string('required_for')->nullable();
            $table->boolean('waived')->default(false);
            $table->timestamps();
            $table->unique(['adoption_id', 'field_definition_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('adoption_requirements');
        Schema::dropIfExists('adoption_field_values');
        Schema::dropIfExists('field_definitions');
        Schema::dropIfExists('field_groups');

        Schema::table('adoptions', function (Blueprint $table) {
            $table->dropForeign(['pre_inspection_confirmed_by']);
            $table->dropColumn(['pre_inspection_confirmed_at', 'pre_inspection_confirmed_by']);
        });

        Schema::table('animal_types', function (Blueprint $table) {
            $table->foreignUuid('pre_inspection_form_template_id')->nullable()
                ->constrained('form_templates')->nullOnDelete();
        });

        Schema::drop('pre_inspections');

        Schema::create('pre_inspections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('person_id')->constrained('people')->onDelete('cascade');
            $table->foreignUuid('animal_type_id')->constrained('animal_types')->restrictOnDelete();
            $table->foreignUuid('inspector_id')->nullable()->constrained('people')->onDelete('restrict');
            $table->enum('verdict', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('notes');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });
    }
};
