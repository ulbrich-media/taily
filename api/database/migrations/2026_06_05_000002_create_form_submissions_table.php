<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('form_submissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('submittable_type');
            $table->uuid('submittable_id');
            $table->unique(['submittable_type', 'submittable_id']);
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
    }
};
