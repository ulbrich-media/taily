<?php

namespace Taily\Support;

use Barryvdh\DomPDF\Facade\Pdf;
use setasign\Fpdi\Fpdi;
use setasign\Fpdi\PdfParser\StreamReader;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Taily\Enums\ContractSignerRole;
use Taily\Models\Adoption;
use Taily\Models\ContractSigningProcess;

class ContractPdfService
{
    /**
     * Render the given adoption's contract template to unsigned PDF bytes.
     *
     * The dompdf output is passed through FPDI before being returned, so the
     * artifact signers review is already the post-import rendering.
     * appendSignaturePages() imports the very same way at completion, which
     * means nothing can be silently dropped between the document that was
     * signed and the document that is delivered.
     *
     * @throws NotFoundHttpException if the template key is unknown.
     */
    public function generate(Adoption $adoption, string $templateKey): string
    {
        [$view, $data] = $this->resolveViewAndData($adoption, $templateKey);

        return $this->assemble([Pdf::loadView($view, $data)->output()]);
    }

    /**
     * Build the final artifact by appending a signature-and-audit-trail
     * appendix to the frozen unsigned PDF.
     *
     * The contract body is never re-rendered: its pages are imported from
     * $unsignedPdfBytes, so completion touches neither the Blade template nor
     * the adoption's current database state. Only the appendix is rendered
     * fresh, which is the one part that is supposed to be new. See ADR-013.
     */
    public function appendSignaturePages(string $unsignedPdfBytes, ContractSigningProcess $process): string
    {
        $process->loadMissing(['signers.person', 'auditEvents.signer.person']);

        $appendix = Pdf::loadView('taily::contracts.signature-appendix', [
            'process' => $process,
            'mediatorSigner' => $process->signers->firstWhere('role', ContractSignerRole::MEDIATOR),
            'adopterSigner' => $process->signers->firstWhere('role', ContractSignerRole::ADOPTER),
            'auditEvents' => $process->auditEvents,
        ])->output();

        return $this->assemble([$unsignedPdfBytes, $appendix]);
    }

    /**
     * Build a download filename for the given adoption's contract PDF.
     */
    public function filename(Adoption $adoption): string
    {
        $animalName = str($adoption->animal?->name ?? 'Tier')->slug();

        return "schutzvertrag-{$animalName}-{$adoption->id}.pdf";
    }

    /**
     * Concatenate the given PDF documents into one, page by page.
     *
     * @param  list<string>  $documents  raw PDF bytes, in output order
     */
    private function assemble(array $documents): string
    {
        $pdf = new Fpdi;

        foreach ($documents as $document) {
            $this->importAllPages($pdf, $document);
        }

        return $pdf->Output('S');
    }

    /**
     * Copy every page of $bytes into $pdf, preserving each page's own size
     * and orientation rather than forcing the writer's default.
     *
     * FPDI carries each page over as a form XObject, so the page's content
     * stream is embedded unchanged — the container around it differs, the
     * rendered content does not.
     */
    private function importAllPages(Fpdi $pdf, string $bytes): void
    {
        $pageCount = $pdf->setSourceFile(StreamReader::createByString($bytes));

        for ($pageNumber = 1; $pageNumber <= $pageCount; $pageNumber++) {
            $template = $pdf->importPage($pageNumber);
            $size = $pdf->getTemplateSize($template);

            $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
            $pdf->useTemplate($template);
        }
    }

    /**
     * @return array{0: string, 1: array<string, mixed>}
     *
     * @throws NotFoundHttpException if the template key is unknown.
     */
    private function resolveViewAndData(Adoption $adoption, string $templateKey): array
    {
        // Indexed directly (not via the "taily.contracts.{$templateKey}" dot
        // path) so a configured key containing a dot, e.g. "regional.v1",
        // resolves to itself instead of being parsed as a nested path.
        $templates = config('taily.contracts', []);
        $template = $templates[$templateKey] ?? null;

        abort_if($template === null, 404, 'Unbekannte Vertragsvorlage.');

        $adoption->load(['animal.animalType', 'mediator.organization', 'applicant']);

        return ["taily::{$template['view']}", [
            'adoption' => $adoption,
            'animal' => $adoption->animal,
            'applicant' => $adoption->applicant,
            'mediator' => $adoption->mediator,
            'organization' => $adoption->mediator?->organization,
        ]];
    }
}
