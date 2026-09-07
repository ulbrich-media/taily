<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contract_signing_processes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('adoption_id')->constrained('adoptions')->onDelete('cascade');
            $table->string('template_key');
            $table->enum('status', [
                'awaiting_mediator_signature',
                'awaiting_adopter_signature',
                'completed',
                'cancelled',
                'expired',
            ])->default('awaiting_mediator_signature');
            $table->string('unsigned_document_hash');
            $table->string('final_document_hash')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('terminated_at')->nullable();
            $table->string('cancellation_reason');
            $table->timestamps();
        });

        Schema::create('contract_signers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('signing_process_id')->constrained('contract_signing_processes')->onDelete('cascade');
            $table->foreignUuid('person_id')->constrained('people')->restrictOnDelete();
            $table->enum('role', ['mediator', 'adopter']);
            $table->timestamp('signed_at')->nullable();
            $table->string('typed_name')->nullable();
            $table->boolean('contract_content_accepted')->nullable();
            $table->boolean('privacy_policy_accepted')->nullable();
            $table->boolean('information_confirmed')->nullable();
            $table->timestamps();
        });

        Schema::create('contract_signing_audit_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('signing_process_id')->constrained('contract_signing_processes')->onDelete('cascade');
            $table->foreignUuid('signer_id')->nullable()->constrained('contract_signers')->nullOnDelete();
            $table->enum('event_type', [
                'link_generated',
                'email_sent',
                'link_opened',
                'signature_submitted',
                'finalized',
                'cancelled',
                'expired',
            ]);
            $table->timestamp('occurred_at');
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_signing_audit_events');
        Schema::dropIfExists('contract_signers');
        Schema::dropIfExists('contract_signing_processes');
    }
};
