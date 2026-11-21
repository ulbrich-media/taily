<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Contract templates as configuration (ADR-017): a title, the wording and
 * three data sections per template, offered for one or more animal types.
 * Replaces the Blade templates registered in config('taily.contracts').
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contract_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('title');
            $table->longText('body');
            // Ordered lists of {key, required} per data section.
            $table->json('animal_fields');
            $table->json('mediator_fields');
            $table->json('adopter_fields');
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
        });

        Schema::create('animal_type_contract_template', function (Blueprint $table) {
            $table->foreignUuid('animal_type_id')->constrained('animal_types')->cascadeOnDelete();
            $table->foreignUuid('contract_template_id')->constrained('contract_templates')->cascadeOnDelete();
            $table->primary(['animal_type_id', 'contract_template_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('animal_type_contract_template');
        Schema::dropIfExists('contract_templates');
    }
};
