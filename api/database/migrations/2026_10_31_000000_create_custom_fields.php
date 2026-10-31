<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Values of the custom fields, one flat key => value object per record
        // (see docs/features/custom-fields.md). Added nullable first so the
        // existing rows can be backfilled with an empty object.
        foreach (['animals', 'people'] as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->json('custom_fields')->nullable();
            });

            DB::table($table)->update(['custom_fields' => '{}']);

            Schema::table($table, function (Blueprint $table) {
                $table->json('custom_fields')->nullable(false)->change();
            });
        }

        Schema::create('custom_field_groups', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('entity', 32);
            $table->string('section', 32);
            $table->json('person_roles');
            $table->foreignUuid('form_template_id')->constrained('form_templates')->restrictOnDelete();
            $table->string('title');
            $table->unsignedInteger('position');
            $table->json('field_settings');
            $table->timestamps();

            $table->unique(['entity', 'form_template_id']);
        });

        Schema::create('custom_field_group_animal_type', function (Blueprint $table) {
            $table->foreignUuid('custom_field_group_id')->constrained('custom_field_groups')->cascadeOnDelete();
            $table->foreignUuid('animal_type_id')->constrained('animal_types')->cascadeOnDelete();

            $table->primary(['custom_field_group_id', 'animal_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_field_group_animal_type');
        Schema::dropIfExists('custom_field_groups');

        foreach (['animals', 'people'] as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->dropColumn('custom_fields');
            });
        }
    }
};
