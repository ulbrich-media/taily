<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Taily\Models\Adoption;
use Taily\Models\Animal;
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
        $animalType = AnimalType::create(['title' => 'Hund']);

        $adoption = Adoption::create([
            'animal_id' => Animal::create(['animal_type_id' => $animalType->id, 'name' => 'Bello', 'gender' => 'male'])->id,
            ...Adoption::applicantDataFrom($__applicant = Person::create(['first_name' => 'Jane', 'last_name' => 'Doe'])),
            'applicant_person_id' => $__applicant->id,
        ]);

        $inspection = PreInspection::create(['adoption_id' => $adoption->id]);

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

    public function test_the_link_closes_when_the_adoption_is_canceled_or_done(): void
    {
        $inspection = $this->createInspection();
        $token = $inspection->activeToken()->token;

        foreach (['canceled', 'done'] as $status) {
            $inspection->adoption->update(['status' => $status]);
            $this->getJson("/internal/inspect/{$token}")->assertNotFound();
            $this->postJson("/internal/inspect/{$token}/submit", ['verdict' => 'approved'])->assertNotFound();
        }

        $inspection->adoption->update(['status' => 'in_progress']);
        $this->getJson("/internal/inspect/{$token}")->assertOk();
        $this->postJson("/internal/inspect/{$token}/submit", ['verdict' => 'approved'])->assertOk();
        $this->assertNotNull($inspection->fresh()->submitted_at);
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
