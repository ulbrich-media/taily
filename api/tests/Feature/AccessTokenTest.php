<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Taily\Models\AnimalType;
use Taily\Models\Person;
use Taily\Models\PreInspection;
use Taily\Tests\TestCase;

class AccessTokenTest extends TestCase
{
    use RefreshDatabase;

    private function createInspection(): PreInspection
    {
        $person = Person::create([
            'first_name' => 'Jane',
            'last_name' => 'Doe',
        ]);

        $animalType = AnimalType::create(['title' => 'Hund']);

        return PreInspection::create([
            'person_id' => $person->id,
            'animal_type_id' => $animalType->id,
        ]);
    }

    public function test_issued_token_is_never_stored_in_plaintext(): void
    {
        $this->assertFalse(Schema::hasColumn('access_tokens', 'token'));

        $inspection = $this->createInspection();
        $accessToken = $inspection->issueToken(now()->addDays(7));

        $row = DB::table('access_tokens')->where('id', $accessToken->id)->first();

        $this->assertNotSame($accessToken->token, $row->token_hash);
        $this->assertNotSame($accessToken->token, $row->token_ciphertext);
        $this->assertSame(hash('sha256', $accessToken->token), $row->token_hash);
    }

    public function test_token_round_trips_through_encryption(): void
    {
        $inspection = $this->createInspection();
        $accessToken = $inspection->issueToken(now()->addDays(7));

        $this->assertSame($accessToken->token, Crypt::decryptString($accessToken->token_ciphertext));
    }

    public function test_where_has_valid_token_finds_the_record_by_the_plaintext_token(): void
    {
        $inspection = $this->createInspection();
        $token = $inspection->issueToken(now()->addDays(7))->token;

        $found = PreInspection::whereHasValidToken($token)->first();

        $this->assertNotNull($found);
        $this->assertSame($inspection->id, $found->id);
    }

    public function test_where_has_valid_token_finds_nothing_for_an_unknown_token(): void
    {
        $this->createInspection()->issueToken(now()->addDays(7));

        $this->assertNull(PreInspection::whereHasValidToken('unknown-token')->first());
    }
}
