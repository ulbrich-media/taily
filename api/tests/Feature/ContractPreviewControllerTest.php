<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use setasign\Fpdi\Fpdi;
use setasign\Fpdi\PdfParser\StreamReader;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\ContractSigner;
use Taily\Models\ContractSigningAuditEvent;
use Taily\Models\ContractSigningProcess;
use Taily\Models\Person;
use Taily\Models\User;
use Taily\Tests\TestCase;

class ContractPreviewControllerTest extends TestCase
{
    use RefreshDatabase;

    private const URL = '/dev/contracts/preview';

    private ?User $user = null;

    private function createAdoption(bool $withMediator = true): Adoption
    {
        $animalType = AnimalType::create(['title' => 'Hund']);

        $animal = Animal::create([
            'animal_type_id' => $animalType->id,
            'name' => 'Bello',
            'gender' => 'male',
        ]);

        return Adoption::create([
            'animal_id' => $animal->id,
            'mediator_id' => $withMediator
                ? Person::create(['first_name' => 'Maria', 'last_name' => 'Vermittlerin'])->id
                : null,
            'applicant_id' => Person::create(['first_name' => 'Anna', 'last_name' => 'Übernehmerin'])->id,
            'contract_signed' => false,
        ]);
    }

    /**
     * The preview requires a logged-in user, so every request in this class
     * goes through here — except the one that proves it does.
     */
    private function preview(string $query = ''): TestResponse
    {
        $this->user ??= User::factory()->create([
            'name' => 'Dev User',
            'email' => 'dev@example.com',
        ]);

        return $this->actingAs($this->user)->get(self::URL.$query);
    }

    private function pageCount(string $pdf): int
    {
        return (new Fpdi)->setSourceFile(StreamReader::createByString($pdf));
    }

    public function test_it_renders_the_contract_body_as_an_inline_pdf(): void
    {
        $this->createAdoption();

        $response = $this->preview();

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/pdf');
        // Inline and uncached, so a browser reload re-renders in place
        // rather than downloading a file or replaying a stale one.
        $this->assertStringStartsWith('inline;', $response->headers->get('Content-Disposition'));
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_the_signed_variant_adds_the_appendix_pages(): void
    {
        $this->createAdoption();

        $body = $this->preview()->getContent();
        $signed = $this->preview('?signed')->getContent();

        $this->assertGreaterThan(
            $this->pageCount($body),
            $this->pageCount($signed),
            'The signed variant must carry the appendix pages on top of the contract body.'
        );
    }

    public function test_the_html_variants_return_the_freshly_rendered_part(): void
    {
        $this->createAdoption();

        $this->preview('?html')
            ->assertOk()
            ->assertSee('Schutzvertrag', false);

        $this->preview('?signed&html')
            ->assertOk()
            ->assertSee('Prüfprotokoll', false);
    }

    public function test_the_synthesized_signing_process_is_rolled_back(): void
    {
        $this->createAdoption();

        $this->preview('?signed')->assertOk();

        // The appendix needs a completed process to render, but a preview
        // must not leave one on the adoption — it would show up in the UI as
        // a real, signed contract.
        $this->assertSame(0, ContractSigningProcess::count());
        $this->assertSame(0, ContractSigner::count());
        $this->assertSame(0, ContractSigningAuditEvent::count());
    }

    public function test_it_404s_for_an_unknown_template_key(): void
    {
        $this->createAdoption();

        $this->preview('?template=nope')->assertNotFound();
    }

    public function test_it_404s_for_an_unknown_adoption(): void
    {
        $this->preview('?adoption=missing')->assertNotFound();
    }

    public function test_it_404s_when_the_adoption_cannot_be_signed(): void
    {
        $this->createAdoption(withMediator: false);

        $this->preview('?signed')->assertNotFound();
    }

    public function test_it_404s_for_a_guest(): void
    {
        $this->createAdoption();

        // Not 401 or a redirect: the endpoint should not advertise itself,
        // and there is no `login` route in this app to redirect to.
        $this->get(self::URL)->assertNotFound();
    }

    public function test_it_404s_outside_local_and_testing(): void
    {
        $this->createAdoption();

        // The route isn't registered in a served environment at all; this
        // covers the controller's own guard, which is what would have to
        // hold if a stale route cache ever carried it into one.
        $this->app['env'] = 'production';

        $this->preview()->assertNotFound();
    }
}
