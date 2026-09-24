<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Taily\Models\AnimalType;
use Taily\Models\Person;
use Taily\Models\PreInspection;
use Taily\Tests\Concerns\EnforcesCsrfProtection;
use Taily\Tests\TestCase;

class PreInspectionSubmissionControllerTest extends TestCase
{
    use EnforcesCsrfProtection, RefreshDatabase;

    private function createInspection(): PreInspection
    {
        $person = Person::create([
            'first_name' => 'Jane',
            'last_name' => 'Doe',
        ]);

        $animalType = AnimalType::create(['title' => 'Hund']);

        $inspection = PreInspection::create([
            'person_id' => $person->id,
            'animal_type_id' => $animalType->id,
        ]);

        $inspection->issueToken(now()->addDays(7));

        return $inspection;
    }

    public function test_public_routes_are_rate_limited_per_token(): void
    {
        $inspection = $this->createInspection();
        $token = $inspection->activeToken()->token;

        for ($i = 0; $i < 20; $i++) {
            $this->getJson("/internal/inspect/{$token}")->assertOk();
        }

        $this->getJson("/internal/inspect/{$token}")->assertStatus(429);
    }

    public function test_submit_rejects_a_request_from_the_spa_session_without_a_csrf_token(): void
    {
        $this->enableCsrfEnforcement();

        $inspection = $this->createInspection();
        $token = $inspection->activeToken()->token;

        // Matches config('sanctum.stateful') (see .env's SANCTUM_STATEFUL_DOMAINS)
        // so the request is treated as coming from the SPA, which is what
        // pulls the session/CSRF middleware into the pipeline at all.
        $response = $this->withHeader('referer', 'http://taily.ddev.site:5544')
            ->postJson("/internal/inspect/{$token}/submit", [
                'verdict' => 'approved',
            ]);

        $response->assertStatus(419);
    }

    public function test_show_sets_a_referrer_policy_header(): void
    {
        $inspection = $this->createInspection();
        $token = $inspection->activeToken()->token;

        $response = $this->getJson("/internal/inspect/{$token}");

        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }
}
