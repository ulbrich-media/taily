<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Testing\TestResponse;
use Taily\Mail\ApplicantLoginMail;
use Taily\Mail\ApplicationConfirmMail;
use Taily\Models\Adoption;
use Taily\Models\AdoptionFieldValue;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\ApplicantSession;
use Taily\Models\FieldDefinition;
use Taily\Models\FieldGroup;
use Taily\Support\CaseFile\FieldCatalogue;
use Taily\Tests\TestCase;

/**
 * Public applications and the applicant portal
 * (docs/features/adoption.md, docs/features/applicant-portal.md).
 */
class ApplicantPortalTest extends TestCase
{
    use RefreshDatabase;

    private AnimalType $dogs;

    private Animal $bello;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        $this->dogs = AnimalType::create(['title' => 'Hund']);
        app(FieldCatalogue::class)->ensureBuiltIns($this->dogs);
        $group = FieldGroup::where('animal_type_id', $this->dogs->id)->value('id');

        $this->field($group, 'living_space_sqm', 'integer', ['required_for' => 'application']);
        $this->field($group, 'internal_rating', 'text', ['visible_to_applicant' => false]);
        $this->field($group, 'id_card_number', 'text', ['collect_at' => 'contract', 'required_for' => 'contract']);
        $this->field($group, 'home_video', 'video', ['required_for' => 'application']);
        $this->field($group, 'landlord_ok', 'boolean', ['requires_review' => true]);

        $this->bello = Animal::create(['animal_type_id' => $this->dogs->id, 'name' => 'Bello', 'gender' => 'male']);
    }

    public function test_the_form_shows_what_the_applicant_is_asked_at_the_application(): void
    {
        $form = $this->getJson("/internal/apply/{$this->bello->id}")->assertOk();

        $keys = collect($form->json('groups'))->flatMap(fn (array $group) => array_column($group['fields'], 'key'))->all();
        $this->assertContains('first_name', $keys);
        $this->assertContains('living_space_sqm', $keys);
        $this->assertNotContains('internal_rating', $keys);
        $this->assertNotContains('id_card_number', $keys);
        $this->assertTrue($form->json('accepts_applications'));
        $this->assertSame('Bello', $form->json('animal.name'));

        $this->bello->update(['is_deceased' => true]);
        $this->assertFalse($this->getJson("/internal/apply/{$this->bello->id}")->json('accepts_applications'));
        $this->apply()->assertUnprocessable()->assertJsonValidationErrors('animal');
    }

    public function test_an_application_needs_the_required_fields_and_is_confirmed_by_email(): void
    {
        $this->apply(['living_space_sqm' => null])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('values.living_space_sqm');
        // Everything missing at once.
        $this->postJson("/internal/apply/{$this->bello->id}", ['values' => ['phone' => '']])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['values.first_name', 'values.last_name', 'values.email', 'values.living_space_sqm']);
        $this->apply(['id_card_number' => 'L01'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('values.id_card_number');
        $this->assertSame(0, Adoption::count());

        // The required video can't be uploaded in the prototype and doesn't block.
        $this->apply()->assertCreated();

        $adoption = Adoption::sole();
        $this->assertSame('unconfirmed', $adoption->status);
        $this->assertSame('anna@example.com', $adoption->applicant_email);
        $this->assertSame('Anna', $adoption->applicant_first_name);

        $token = $this->sentToken(ApplicationConfirmMail::class);
        $mail = (new ApplicationConfirmMail($adoption, $token))->render();
        $this->assertStringContainsString('Bello', $mail);
        $this->assertStringContainsString('action=application_confirm', $mail);
        $this->assertStringContainsString('action=applicant_login', (new ApplicantLoginMail('t'))->render());
        $session = $this->postJson("/internal/apply/confirm/{$token}")->assertOk()->json('session_token');
        $this->assertSame('pending', $adoption->fresh()->status);
        $this->assertNotNull(ApplicantSession::findValid($session));

        // Single use.
        $this->postJson("/internal/apply/confirm/{$token}")->assertNotFound();
    }

    public function test_logging_in_by_email_does_not_reveal_unknown_addresses(): void
    {
        $known = $this->postJson('/internal/portal/login', ['email' => 'Anna@Example.com'])->assertOk()->json('message');
        Mail::assertNothingSent();

        $this->adoption(['status' => 'pending']);
        $this->assertSame($known, $this->postJson('/internal/portal/login', ['email' => 'anna@example.com'])->json('message'));

        $token = $this->sentToken(ApplicantLoginMail::class);
        $session = $this->postJson("/internal/portal/login/{$token}")->assertOk()->json('session_token');
        $this->postJson("/internal/portal/login/{$token}")->assertNotFound();

        $this->portal('get', 'adoptions', $session)->assertOk()->assertJsonPath('email', 'anna@example.com');
    }

    public function test_the_portal_shows_only_the_applicants_own_adoptions(): void
    {
        $own = $this->adoption(['status' => 'pending']);
        $this->adoption(['status' => 'unconfirmed']);
        $other = $this->adoption(['status' => 'pending', 'applicant_email' => 'otto@example.com']);
        $canceled = $this->adoption(['status' => 'canceled', 'canceled_reason' => 'Nicht geeignet']);
        $session = ApplicantSession::open('anna@example.com')[1];

        $ids = array_column($this->portal('get', 'adoptions', $session)->json('adoptions'), 'id');
        $this->assertEqualsCanonicalizing([$own->id, $canceled->id], $ids);

        $this->portal('get', "adoptions/{$other->id}", $session)->assertNotFound();
        $ended = $this->portal('get', "adoptions/{$canceled->id}", $session)->assertOk()->json();
        $this->assertArrayNotHasKey('groups', $ended);
        $this->assertStringNotContainsString('Nicht geeignet', json_encode($ended));

        $this->portal('get', 'adoptions', 'nonsense')->assertUnauthorized();
    }

    public function test_the_applicant_edits_the_fields_of_the_current_step(): void
    {
        $adoption = $this->adoption(['status' => 'pending']);
        $session = ApplicantSession::open('anna@example.com')[1];

        $shown = $this->portal('get', "adoptions/{$adoption->id}", $session)->assertOk();
        $this->assertSame('application', $shown->json('current_step'));
        $this->assertSame('pending', $shown->json('steps.0.status'), 'the application is under review');
        $this->assertContains('living_space_sqm', array_column($shown->json('open'), 'key'));

        $this->portal('put', "adoptions/{$adoption->id}/case-file", $session, ['values' => ['living_space_sqm' => 85, 'landlord_ok' => true]])
            ->assertOk()
            // Only the video is left; uploads aren't part of the prototype.
            ->assertJsonPath('data.open.0.key', 'home_video')
            ->assertJsonCount(1, 'data.open');
        $value = AdoptionFieldValue::where('adoption_id', $adoption->id)->whereRelation('fieldDefinition', 'key', 'landlord_ok')->first();
        $this->assertSame(AdoptionFieldValue::REVIEW_PENDING, $value->review_status, 'the applicant\'s answer still needs review');

        // Not yet asked, internal, or what the login is tied to.
        foreach (['id_card_number' => 'L01', 'internal_rating' => 'gut', 'email' => 'neu@example.com'] as $key => $value) {
            $this->portal('put', "adoptions/{$adoption->id}/case-file", $session, ['values' => [$key => $value]])
                ->assertUnprocessable()
                ->assertJsonValidationErrors("values.{$key}");
        }

        // Once the adoption is running, later steps open up.
        $adoption->update(['status' => 'in_progress', 'pre_inspection_confirmed_at' => now()]);
        $this->assertSame('contract', $this->portal('get', "adoptions/{$adoption->id}", $session)->json('current_step'));
        $this->portal('put', "adoptions/{$adoption->id}/case-file", $session, ['values' => ['id_card_number' => 'L01']])->assertOk();

        $adoption->update(['status' => 'done']);
        $this->portal('put', "adoptions/{$adoption->id}/case-file", $session, ['values' => ['living_space_sqm' => 90]])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('values');
    }

    /**
     * @param  array<string, mixed>  $values
     */
    private function apply(array $values = []): TestResponse
    {
        return $this->postJson("/internal/apply/{$this->bello->id}", ['values' => array_merge([
            'first_name' => 'Anna',
            'last_name' => 'Adopter',
            'email' => 'Anna@Example.com',
            'living_space_sqm' => 80,
        ], $values)]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function portal(string $method, string $path, string $session, array $data = []): TestResponse
    {
        return $this->withHeader('Authorization', "Bearer {$session}")->json(strtoupper($method), "/internal/portal/{$path}", $data);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function adoption(array $attributes): Adoption
    {
        return Adoption::create([
            'animal_id' => $this->bello->id,
            'applicant_first_name' => 'Anna',
            'applicant_last_name' => 'Adopter',
            'applicant_email' => 'anna@example.com',
            ...$attributes,
        ]);
    }

    /**
     * @param  class-string  $mailable
     */
    private function sentToken(string $mailable): string
    {
        $token = null;
        Mail::assertSent($mailable, function ($mail) use (&$token) {
            $token = $mail->plainTextToken;

            return true;
        });

        return $token;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function field(string $group, string $key, string $type, array $attributes = []): void
    {
        FieldDefinition::create([
            'animal_type_id' => $this->dogs->id,
            'field_group_id' => $group,
            'position' => FieldDefinition::where('field_group_id', $group)->count(),
            'key' => $key,
            'type' => $type,
            'label' => $key,
            'collect_at' => 'application',
            ...$attributes,
        ]);
    }
}
