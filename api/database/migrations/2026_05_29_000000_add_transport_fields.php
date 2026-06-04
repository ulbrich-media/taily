<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transports', function (Blueprint $table) {
            $table->string('name')->after('id');
            $table->date('planned_at')->nullable()->after('notes');
            $table->timestamp('done_at')->nullable()->after('planned_at');
            $table->foreignUuid('responsible_id')->nullable()->constrained('people')->nullOnDelete()->after('done_at');
            $table->string('transporter')->after('responsible_id');
        });
    }

    public function down(): void
    {
        Schema::table('transports', function (Blueprint $table) {
            $table->dropConstrainedForeignId('responsible_id');
            $table->dropColumn(['name', 'planned_at', 'done_at', 'transporter']);
        });
    }
};
