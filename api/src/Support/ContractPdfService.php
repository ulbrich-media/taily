<?php

namespace Taily\Support;

use Barryvdh\DomPDF\Facade\Pdf;
use Dompdf\Dompdf;
use Illuminate\Support\Facades\Storage;
use setasign\Fpdi\Fpdi;
use setasign\Fpdi\PdfParser\StreamReader;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Taily\Enums\ContractSignerRole;
use Taily\Models\Adoption;
use Taily\Models\Animal;
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
        $pdf = Pdf::loadHtml($this->renderBody($adoption, $templateKey));
        $pdf->render();
        $this->stampPageNumbers($pdf->getDomPDF());

        return $this->assemble([$pdf->output()]);
    }

    /**
     * The contract body's HTML, exactly as dompdf receives it in generate().
     *
     * Split out so it can be inspected on its own — see the
     * `taily:preview-contract` command, which writes it to a file for
     * template debugging in a browser, where the edit-reload loop is a
     * fraction of a PDF render.
     *
     * @throws NotFoundHttpException if the template key is unknown.
     */
    public function renderBody(Adoption $adoption, string $templateKey): string
    {
        [$view, $data] = $this->resolveViewAndData($adoption, $templateKey);

        return view($view, $data)->render();
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
        $appendix = Pdf::loadHtml($this->renderAppendix($process))->output();

        return $this->assemble([$unsignedPdfBytes, $appendix]);
    }

    /**
     * The signature-and-audit-trail appendix's HTML, exactly as dompdf
     * receives it in appendSignaturePages(). Split out for the same reason
     * as renderBody().
     */
    public function renderAppendix(ContractSigningProcess $process): string
    {
        $process->loadMissing(['signers.person', 'auditEvents.signer.person']);

        return view('taily::contracts.signature-appendix', [
            'process' => $process,
            'mediatorSigner' => $process->signers->firstWhere('role', ContractSignerRole::MEDIATOR),
            'adopterSigner' => $process->signers->firstWhere('role', ContractSignerRole::ADOPTER),
            'auditEvents' => $process->auditEvents,
        ])->render();
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

        $adoption->load(['animal.animalType', 'animal.media', 'mediator.organization', 'applicant']);

        return ["taily::{$template['view']}", [
            'adoption' => $adoption,
            'animal' => $adoption->animal,
            'animalPhoto' => $this->animalPhotoDataUri($adoption->animal),
            'applicant' => $adoption->applicant,
            'mediator' => $adoption->mediator,
            'organization' => $adoption->mediator?->organization,
        ]];
    }

    /**
     * The animal's first uploaded picture, embedded as a data URI so dompdf
     * can render it without hitting its remote-fetch/chroot restrictions.
     *
     * Returns null if there is no picture (the `pictures` collection can
     * also hold videos, which are skipped here) or if the format can't be
     * rendered in this environment — e.g. a webp upload without GD's webp
     * support compiled in. The template treats null exactly like "no
     * photo", never a broken-image icon.
     */
    private function animalPhotoDataUri(Animal $animal): ?string
    {
        $media = $animal->getMedia('pictures')
            ->first(fn (Media $item) => str_starts_with($item->mime_type ?? '', 'image/'));

        if ($media === null) {
            return null;
        }

        if ($media->mime_type === 'image/webp' && ! function_exists('imagecreatefromwebp')) {
            return null;
        }

        $conversion = $media->hasGeneratedConversion('preview') ? 'preview' : '';
        $disk = $conversion !== '' ? ($media->conversions_disk ?? $media->disk) : $media->disk;

        $bytes = Storage::disk($disk)->get($media->getPathRelativeToRoot($conversion));

        if ($bytes === null) {
            return null;
        }

        return "data:{$media->mime_type};base64,".base64_encode($bytes);
    }

    /**
     * Stamp "Seite X von Y" into the footer of every page of the body.
     *
     * dompdf has no CSS-only way to know the total page count while a page
     * is being laid out, so the template itself can't render this. The
     * canvas-level page_text() API is the documented way to do it: it
     * defers drawing until every page exists, then substitutes {PAGE_NUM} /
     * {PAGE_COUNT} into the given text per page. This works without
     * enabling isPhpEnabled, which would otherwise broaden dompdf's
     * execution surface for a template that has no other reason to run
     * embedded PHP.
     */
    private function stampPageNumbers(Dompdf $dompdf): void
    {
        $canvas = $dompdf->getCanvas();
        $font = $dompdf->getFontMetrics()->getFont('Helvetica');

        $canvas->page_text(
            $canvas->get_width() - 150,
            $canvas->get_height() - 45,
            'Seite {PAGE_NUM} von {PAGE_COUNT}',
            $font,
            9,
            [0.169, 0.165, 0.133],
        );
    }
}
