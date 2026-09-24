<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contract_signers', function (Blueprint $table) {
            $table->timestamp('week_reminder_sent_at')->nullable()->after('signed_at');
            $table->timestamp('two_day_reminder_sent_at')->nullable()->after('week_reminder_sent_at');
        });
    }

    public function down(): void
    {
        Schema::table('contract_signers', function (Blueprint $table) {
            $table->dropColumn(['week_reminder_sent_at', 'two_day_reminder_sent_at']);
        });
    }
};
