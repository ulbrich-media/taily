<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Public applications and the applicant portal (docs/features/adoption.md,
 * docs/features/applicant-portal.md): unconfirmed adoptions, the emailed
 * single-use links, and portal sessions. Applicants have no account; the
 * email is the identity (ADR-018).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('adoptions', function (Blueprint $table) {
            $table->enum('status', ['unconfirmed', 'pending', 'in_progress', 'canceled', 'done'])->default('pending')->change();
        });

        // Emailed links: confirming an application, or logging into the portal.
        Schema::create('applicant_links', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('email')->index();
            $table->enum('purpose', ['confirm', 'login']);
            $table->foreignUuid('adoption_id')->nullable()->constrained('adoptions')->cascadeOnDelete();
            $table->string('token', 64)->unique();
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->timestamps();
        });

        Schema::create('applicant_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('email')->index();
            $table->string('token', 64)->unique();
            $table->timestamp('expires_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applicant_sessions');
        Schema::dropIfExists('applicant_links');

        Schema::table('adoptions', function (Blueprint $table) {
            $table->enum('status', ['pending', 'in_progress', 'canceled', 'done'])->default('pending')->change();
        });
    }
};
