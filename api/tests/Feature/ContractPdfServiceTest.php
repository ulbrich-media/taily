<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use setasign\Fpdi\Fpdi;
use setasign\Fpdi\PdfParser\StreamReader;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\ContractSigningProcess;
use Taily\Models\Organization;
use Taily\Models\Person;
use Taily\Support\ContractPdfService;
use Taily\Support\ContractSigningService;
use Taily\Tests\TestCase;

class ContractPdfServiceTest extends TestCase
{
    use RefreshDatabase;

    private function createAdoption(bool $withMediator = true, bool $withOrganization = true): Adoption
    {
        $animalType = AnimalType::create(['title' => 'Hund']);

        $animal = Animal::create([
            'animal_type_id' => $animalType->id,
            'name' => 'Bello',
            'gender' => 'male',
        ]);

        $mediatorId = null;
        if ($withMediator) {
            $organizationId = null;
            if ($withOrganization) {
                $organizationId = Organization::create(['name' => 'Tierheim Musterstadt'])->id;
            }

            $mediatorId = Person::create([
                'first_name' => 'Maria',
                'last_name' => 'Vermittlerin',
                'organization_id' => $organizationId,
            ])->id;
        }

        $applicant = Person::create([
            'first_name' => 'Anna',
            'last_name' => 'Übernehmerin',
        ]);

        return Adoption::create([
            'animal_id' => $animal->id,
            'mediator_id' => $mediatorId,
            'applicant_id' => $applicant->id,
            'contract_signed' => false,
        ]);
    }

    public function test_generate_renders_a_pdf_when_mediator_has_an_organization(): void
    {
        $adoption = $this->createAdoption(withMediator: true, withOrganization: true);

        $pdf = (new ContractPdfService)->generate($adoption, 'default');

        $this->assertStringStartsWith('%PDF', $pdf);
    }

    public function test_generate_renders_a_pdf_when_adoption_has_no_mediator(): void
    {
        $adoption = $this->createAdoption(withMediator: false);

        $pdf = (new ContractPdfService)->generate($adoption, 'default');

        $this->assertStringStartsWith('%PDF', $pdf);
    }

    public function test_generate_renders_a_pdf_when_mediator_has_no_organization(): void
    {
        $adoption = $this->createAdoption(withMediator: true, withOrganization: false);

        $pdf = (new ContractPdfService)->generate($adoption, 'default');

        $this->assertStringStartsWith('%PDF', $pdf);
    }

    public function test_generate_throws_for_an_unknown_template_key(): void
    {
        $adoption = $this->createAdoption();

        $this->expectException(NotFoundHttpException::class);

        (new ContractPdfService)->generate($adoption, 'unknown');
    }

    public function test_generate_resolves_a_template_key_containing_a_dot(): void
    {
        // A key like "regional.v1" must be looked up literally, not treated
        // as a nested config path ("contracts.regional.v1") by config().
        config(['taily.contracts' => array_merge(config('taily.contracts'), [
            'regional.v1' => ['label' => 'Regional', 'view' => 'contracts.default'],
        ])]);

        $adoption = $this->createAdoption();

        $pdf = (new ContractPdfService)->generate($adoption, 'regional.v1');

        $this->assertStringStartsWith('%PDF', $pdf);
    }

    public function test_filename_includes_a_slugified_animal_name_and_the_adoption_id(): void
    {
        $adoption = $this->createAdoption();

        $filename = (new ContractPdfService)->filename($adoption);

        $this->assertSame("schutzvertrag-bello-{$adoption->id}.pdf", $filename);
    }

    public function test_generate_renders_a_pdf_when_the_animal_has_no_picture(): void
    {
        $adoption = $this->createAdoption();

        $pdf = (new ContractPdfService)->generate($adoption, 'default');

        $this->assertStringStartsWith('%PDF', $pdf);
    }

    public function test_generate_embeds_the_animals_first_picture(): void
    {
        $adoption = $this->createAdoption();
        $adoption->animal->addMedia(UploadedFile::fake()->image('bello.jpg', 400, 300))->toMediaCollection('pictures');

        $pdf = (new ContractPdfService)->generate($adoption->fresh(), 'default');

        $this->assertStringStartsWith('%PDF', $pdf);
        $this->assertStringContainsString('/Subtype /Image', $pdf);
    }

    public function test_generate_does_not_pick_a_video_from_the_pictures_collection_as_the_photo(): void
    {
        $adoption = $this->createAdoption();
        $adoption->animal->addMedia(UploadedFile::fake()->create('bello.mp4', 10, 'video/mp4'))->toMediaCollection('pictures');

        $pdf = (new ContractPdfService)->generate($adoption->fresh(), 'default');

        $this->assertStringStartsWith('%PDF', $pdf);
        $this->assertStringNotContainsString('/Subtype /Image', $pdf);
    }

    public function test_generate_embeds_or_gracefully_skips_a_webp_picture(): void
    {
        if (! function_exists('imagewebp') || ! function_exists('imagecreatefromwebp')) {
            $this->markTestSkipped('GD in this environment has no webp support, not even to prepare the test fixture.');
        }

        $adoption = $this->createAdoption();
        $adoption->animal->addMedia(UploadedFile::fake()->image('bello.webp', 400, 300))->toMediaCollection('pictures');

        $pdf = (new ContractPdfService)->generate($adoption->fresh(), 'default');

        // Whether the environment's GD build can decode webp or not, this
        // must never throw — no photo (missing GD webp support) is an
        // acceptable outcome here, a broken generation is not.
        $this->assertStringStartsWith('%PDF', $pdf);
    }

    /**
     * @return array{0: Adoption, 1: Organization}
     */
    private function createAdoptionWithFullDetails(): array
    {
        $animalType = AnimalType::create(['title' => 'Hund']);

        $organization = Organization::create([
            'name' => 'Tierheim Musterstadt',
            'email' => 'info@tierheim-musterstadt.de',
            'phone' => '030 1234567',
            'street_line' => 'Tierheimweg',
            'street_line_additional' => '1',
            'postal_code' => '12345',
            'city' => 'Musterstadt',
        ]);

        $mediator = Person::create([
            'first_name' => 'Maria',
            'last_name' => 'Vermittlerin',
            'organization_id' => $organization->id,
        ]);

        $animal = Animal::create([
            'animal_type_id' => $animalType->id,
            'name' => 'Bello',
            'gender' => 'male',
            'color' => 'Braun-Weiß',
            'date_of_birth' => '2020-05-01',
        ]);

        $applicant = Person::create([
            'first_name' => 'Anna',
            'last_name' => 'Übernehmerin',
            'date_of_birth' => '1990-03-15',
        ]);

        $adoption = Adoption::create([
            'animal_id' => $animal->id,
            'mediator_id' => $mediator->id,
            'applicant_id' => $applicant->id,
            'contract_signed' => false,
        ]);

        return [$adoption, $organization];
    }

    public function test_generate_renders_the_new_fields_branding_and_page_count(): void
    {
        [$adoption] = $this->createAdoptionWithFullDetails();

        $pdf = (new ContractPdfService)->generate($adoption, 'default');
        $text = $this->extractText($pdf);

        $this->assertStringContainsString('Braun-Wei', $text); // "ß" is dropped by the core-font-only extraction regex
        $this->assertStringContainsString('01.05.2020', $text);
        $this->assertStringContainsString('15.03.1990', $text);
        $this->assertStringContainsString('Taily', $text);
        $this->assertStringContainsString('tierheim-musterstadt.de', $text);
        $this->assertStringContainsString('1234567', $text);
        $this->assertStringContainsString('Seite', $text);
    }

    public function test_generate_no_longer_renders_a_signature_line(): void
    {
        [$adoption] = $this->createAdoptionWithFullDetails();

        $pdf = (new ContractPdfService)->generate($adoption, 'default');
        $text = $this->extractText($pdf);

        $this->assertStringNotContainsString('Unterschrift', $text);
    }

    /**
     * @return array{0: ContractSigningProcess, 1: string}
     */
    private function completedProcessWithFrozenPdf(): array
    {
        Storage::fake('contract-signing-document');

        $adoption = $this->createAdoption();
        $pdfService = new ContractPdfService;
        $signingService = new ContractSigningService;

        $unsigned = $pdfService->generate($adoption, 'default');
        $process = $signingService->start($adoption, 'default', $unsigned);
        $signingService->recordMediatorSignature($process, 'Maria Vermittlerin', true, true, true);
        $signingService->recordAdopterSignature($process, 'Anna Übernehmerin', true, true, true);

        return [$process->fresh(), $unsigned];
    }

    private function pageCount(string $pdf): int
    {
        return (new Fpdi)->setSourceFile(StreamReader::createByString($pdf));
    }

    /**
     * Every stream blob long enough to be page content or an embedded font.
     *
     * @return list<string>
     */
    private function significantStreams(string $pdf): array
    {
        preg_match_all('/stream\r?\n(.*?)\r?\nendstream/s', $pdf, $matches);

        return array_values(array_filter($matches[1], fn (string $stream) => strlen($stream) > 40));
    }

    public function test_generate_returns_a_pdf_that_can_be_imported_again(): void
    {
        $adoption = $this->createAdoption();

        $pdf = (new ContractPdfService)->generate($adoption, 'default');

        // Normalised through FPDI on the way out, so the bytes signers review
        // are already the post-import rendering — see appendSignaturePages().
        $this->assertStringStartsWith('%PDF', $pdf);
        $this->assertGreaterThanOrEqual(1, $this->pageCount($pdf));
    }

    public function test_append_signature_pages_keeps_the_contract_pages_and_adds_the_appendix(): void
    {
        [$process, $unsigned] = $this->completedProcessWithFrozenPdf();

        $final = (new ContractPdfService)->appendSignaturePages($unsigned, $process);

        $this->assertStringStartsWith('%PDF', $final);
        $this->assertGreaterThan(
            $this->pageCount($unsigned),
            $this->pageCount($final),
            'The final document must have more pages than the contract it wraps.'
        );
    }

    public function test_append_signature_pages_carries_the_contract_content_over_verbatim(): void
    {
        [$process, $unsigned] = $this->completedProcessWithFrozenPdf();

        $final = (new ContractPdfService)->appendSignaturePages($unsigned, $process);

        // The whole-file bytes necessarily differ — appending shifts every
        // xref offset. What must not differ is the contract's own page
        // content, which FPDI carries across as an embedded form XObject.
        // This is the property the evidentiary claim rests on: the pages in
        // the final document are the pages that were signed, not a re-render.
        $carried = $this->significantStreams($unsigned);
        $this->assertNotEmpty($carried);

        foreach ($carried as $stream) {
            $this->assertStringContainsString(
                $stream,
                $final,
                'A contract content stream was altered while appending the signature pages.'
            );
        }
    }

    /** All drawable text in the document, decompressed out of its content streams. */
    private function extractText(string $pdf): string
    {
        $text = '';

        foreach ($this->significantStreams($pdf) as $stream) {
            $raw = @gzuncompress($stream);

            if ($raw === false) {
                continue;
            }

            // dompdf writes core-font text as an array of literal strings:
            // BT ... [(Unterschriften)] TJ ET
            if (preg_match_all('/\\(((?:[^()\\\\]|\\\\.)*)\\)[\\]\\s]*T[jJ]/', $raw, $matches)) {
                // Core fonts write plain bytes; subset TrueType fonts (the
                // italic signature name, the monospace hash) write UTF-16BE,
                // so drop the null padding to compare both as ASCII.
                $text .= str_replace("\0", '', implode(' ', $matches[1])).' ';
            }
        }

        return $text;
    }

    public function test_append_signature_pages_renders_the_typed_names_and_document_hash(): void
    {
        [$process, $unsigned] = $this->completedProcessWithFrozenPdf();

        $final = (new ContractPdfService)->appendSignaturePages($unsigned, $process);
        $text = $this->extractText($final);

        // The appendix is the only part rendered fresh at completion, so this
        // is the only place the signature evidence can have come from.
        $this->assertStringContainsString('Unterschriften', $text);
        $this->assertStringContainsString('Vermittlerin', $text);
        $this->assertStringContainsString('bernehmerin', $text);
        $this->assertStringContainsString('fprotokoll', $text);
        $this->assertStringContainsString(substr($process->unsigned_document_hash, 0, 16), $text);
    }

    public function test_append_signature_pages_does_not_re_render_the_contract_template(): void
    {
        [$process, $unsigned] = $this->completedProcessWithFrozenPdf();

        // Point the process at a template key that no longer exists. A
        // re-rendering implementation would abort with a 404; an appending
        // one never touches the template at all.
        $process->template_key = 'gone';
        $process->save();

        $final = (new ContractPdfService)->appendSignaturePages($unsigned, $process->fresh());

        $this->assertStringStartsWith('%PDF', $final);
    }
}
