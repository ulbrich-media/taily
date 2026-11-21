<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('export_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('key')->unique();
            $table->json('value');
            $table->timestamps();
        });

        // The default mapping, so the export works without configuration.
        DB::table('export_settings')->insert([
            'id' => (string) Str::uuid(),
            'key' => 'tiervermittlung.compatible_with',
            'value' => json_encode([
                'children' => ['Kinder'],
                'dogs' => ['Hunde', 'Rüden', 'Hündinnen'],
                'cats' => ['Katzen'],
            ], JSON_UNESCAPED_UNICODE),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('export_settings');
    }
};
