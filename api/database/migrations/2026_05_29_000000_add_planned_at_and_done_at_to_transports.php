<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transports', function (Blueprint $table) {
            $table->date('planned_at')->nullable()->after('notes');
            $table->timestamp('done_at')->nullable()->after('planned_at');
        });
    }

    public function down(): void
    {
        Schema::table('transports', function (Blueprint $table) {
            $table->dropColumn(['planned_at', 'done_at']);
        });
    }
};
