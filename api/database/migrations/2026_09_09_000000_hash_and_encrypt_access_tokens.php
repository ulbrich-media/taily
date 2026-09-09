<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Access tokens (pre-inspection and contract-signer links) used to be stored
 * in plaintext with equality lookups. token_hash gives an indexed lookup
 * without an unbounded table scan; token_ciphertext keeps the plaintext
 * recoverable for ProcessContractSigningReminders and the pre-inspection
 * "copy link" action, which both need it well after issuance — unlike a
 * one-way hash, which only ever has the plaintext available at issuance.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('access_tokens', function (Blueprint $table) {
            $table->string('token_hash', 64)->nullable()->unique()->after('token');
            $table->text('token_ciphertext')->nullable()->after('token_hash');
        });

        foreach (DB::table('access_tokens')->select('id', 'token')->cursor() as $accessToken) {
            DB::table('access_tokens')
                ->where('id', $accessToken->id)
                ->update([
                    'token_hash' => hash('sha256', $accessToken->token),
                    'token_ciphertext' => Crypt::encryptString($accessToken->token),
                ]);
        }

        Schema::table('access_tokens', function (Blueprint $table) {
            $table->dropColumn('token');
        });
    }

    public function down(): void
    {
        // Irreversible: the plaintext token column is gone once dropped.
    }
};
