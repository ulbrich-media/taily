<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ----------------------------------------------------------------
        // transports (stub — full lifecycle fields added later)
        // ----------------------------------------------------------------
        Schema::create('transports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->text('notes')->default('');
            $table->timestamps();
        });

        // ----------------------------------------------------------------
        // adoptions — structural rework
        // ----------------------------------------------------------------
        Schema::table('adoptions', function (Blueprint $table) {
            // Remove redundant / relocated columns
            $table->dropForeign(['inspector_id']);
            $table->dropColumn(['inspector_id', 'pre_inspection_result', 'transfer_planned_at', 'transferred_at']);
        });

        Schema::table('adoptions', function (Blueprint $table) {
            // Rename mediator notes field to match _notes convention
            $table->renameColumn('pre_inspection_summary', 'pre_inspection_notes');
        });

        Schema::table('adoptions', function (Blueprint $table) {
            // General adoption lifecycle status
            $table->enum('status', ['pending', 'in_progress', 'canceled', 'done'])->default('pending')->after('applicant_id');
            $table->timestamp('canceled_at')->nullable()->after('status');
            $table->text('canceled_reason')->default('')->after('canceled_at');

            // Application step
            $table->text('application_notes')->default('')->after('canceled_reason');

            // Contract step
            $table->timestamp('contract_signed_at')->nullable()->after('contract_signed');

            // Transport step (stub FK)
            $table->foreignUuid('transport_id')->nullable()->after('contract_signed_at')
                ->constrained('transports')->nullOnDelete();

            // Handover step
            $table->timestamp('handed_over_at')->nullable()->after('transport_id');
        });
    }

    public function down(): void
    {
        Schema::table('adoptions', function (Blueprint $table) {
            $table->dropForeign(['transport_id']);
            $table->dropColumn([
                'status',
                'canceled_at',
                'canceled_reason',
                'application_notes',
                'contract_signed_at',
                'transport_id',
                'handed_over_at',
            ]);
        });

        Schema::table('adoptions', function (Blueprint $table) {
            $table->renameColumn('pre_inspection_notes', 'pre_inspection_summary');
        });

        Schema::table('adoptions', function (Blueprint $table) {
            $table->foreignUuid('inspector_id')->nullable()->constrained('people')->onDelete('set null');
            $table->enum('pre_inspection_result', ['not_conducted', 'approved', 'rejected'])->default('not_conducted');
            $table->date('transfer_planned_at')->nullable();
            $table->date('transferred_at')->nullable();
        });

        Schema::dropIfExists('transports');
    }
};
