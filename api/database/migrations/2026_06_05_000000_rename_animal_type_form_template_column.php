<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('animal_types', function (Blueprint $table) {
            $table->renameColumn('form_template_id', 'pre_inspection_form_template_id');
        });
    }

    public function down(): void
    {
        Schema::table('animal_types', function (Blueprint $table) {
            $table->renameColumn('pre_inspection_form_template_id', 'form_template_id');
        });
    }
};
