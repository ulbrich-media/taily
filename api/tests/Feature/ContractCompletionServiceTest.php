<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use setasign\Fpdi\Fpdi;
use setasign\Fpdi\PdfParser\StreamReader;
use Taily\Exceptions\ContractDocumentIntegrityException;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\ContractSigningProcess;
use Taily\Models\Person;
use Taily\Support\ContractCompletionService;
use Taily\Support\ContractPdfService;
use Taily\Support\ContractSigningService;
use Taily\Tests\TestCase;

class ContractCompletionServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('contract-signing-document');
        Storage::fake('adoption-contract');
        Mail::fake();
    }

    private function createAdoption(): Adoption
    {
        $animalType = AnimalType::create(['title' => 'Hund']);

        $animal = Animal::create([
            'animal_type_id' => $animalType->id,
            'name' => 'Bello',
            'gender' => 'male',
        ]);

        $mediator = Person::create([
            'first_name' => 'Maria',
            'last_name' => 'Vermittlerin',
            'email' => 'maria@example.com',
        ]);

        $applicant = Person::create([
            'first_name' => 'Anna',
            'last_name' => 'Übernehmerin',
            'email' => 'anna@example.com',
        ]);

        return Adoption::create([
            'animal_id' => $animal->id,
            'mediator_id' => $mediator->id,
            'applicant_id' => $applicant->id,
            'contract_signed' => false,
        ]);
    }

    /** Drives a process all the way to both signatures, ready to complete. */
    private function signedProcess(): ContractSigningProcess
    {
        $adoption = $this->createAdoption();
        $pdfService = new ContractPdfService;
        $signingService = new ContractSigningService;

        $process = $signingService->start($adoption, 'default', $pdfService->generate($adoption, 'default'));
        $signingService->recordMediatorSignature($process, 'Maria Vermittlerin', true, true, true);
        $signingService->recordAdopterSignature($process, 'Anna Übernehmerin', true, true, true);

        return $process->fresh();
    }

    private function completionService(): ContractCompletionService
    {
        return new ContractCompletionService(new ContractPdfService, new ContractSigningService);
    }

    private function overwriteFrozenDocument(ContractSigningProcess $process, string $bytes): void
    {
        $media = $process->getFirstMedia('document');

        Storage::disk($media->disk)->put($media->getPathRelativeToRoot(), $bytes);
    }

    public function test_complete_appends_the_appendix_to_the_frozen_contract(): void
    {
        $process = $this->signedProcess();
        $frozen = Storage::disk('contract-signing-document')
            ->get($process->getFirstMedia('document')->getPathRelativeToRoot());

        $this->completionService()->complete($process);

        $process->refresh();
        $finalBytes = Storage::disk('contract-signing-document')
            ->get($process->getFirstMedia('final')->getPathRelativeToRoot());

        $pages = fn (string $pdf) => (new Fpdi)->setSourceFile(StreamReader::createByString($pdf));

        $this->assertGreaterThan($pages($frozen), $pages($finalBytes));
        $this->assertSame($process->final_document_hash, hash('sha256', $finalBytes));
    }

    public function test_complete_marks_the_adoption_signed_and_stores_the_contract(): void
    {
        $process = $this->signedProcess();

        $this->completionService()->complete($process);

        $adoption = $process->adoption->fresh();

        $this->assertTrue($adoption->contract_signed);
        $this->assertNotNull($adoption->contract_signed_at);
        $this->assertNotNull($adoption->getFirstMedia('contract'));
    }

    public function test_complete_refuses_when_the_frozen_document_was_altered_on_disk(): void
    {
        $process = $this->signedProcess();

        $this->overwriteFrozenDocument($process, '%PDF-1.7 tampered');

        $this->expectException(ContractDocumentIntegrityException::class);

        $this->completionService()->complete($process);
    }

    public function test_a_refused_completion_leaves_the_adoption_untouched(): void
    {
        $process = $this->signedProcess();

        $this->overwriteFrozenDocument($process, '%PDF-1.7 tampered');

        try {
            $this->completionService()->complete($process);
        } catch (ContractDocumentIntegrityException) {
            // Expected — asserted in the sibling test.
        }

        $adoption = $process->adoption->fresh();

        $this->assertFalse($adoption->contract_signed);
        $this->assertNull($process->fresh()->final_document_hash);
        $this->assertNull($adoption->getFirstMedia('contract'));
    }

    public function test_complete_refuses_when_the_frozen_document_is_missing(): void
    {
        $process = $this->signedProcess();
        $process->clearMediaCollection('document');

        $this->expectException(ContractDocumentIntegrityException::class);

        $this->completionService()->complete($process->fresh());
    }
}
