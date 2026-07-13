<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Invitation tokens used to be stored in plaintext; UserInvitation now only
 * persists their SHA-256 hash so a leaked database copy cannot take over
 * pending accounts. Hashing the existing rows keeps already-sent invitation
 * links working: lookups hash the incoming token before comparing.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (DB::table('user_invitations')->select('id', 'token')->cursor() as $invitation) {
            DB::table('user_invitations')
                ->where('id', $invitation->id)
                ->update(['token' => hash('sha256', $invitation->token)]);
        }
    }

    public function down(): void
    {
        // Irreversible: the plaintext tokens are gone once hashed.
    }
};
