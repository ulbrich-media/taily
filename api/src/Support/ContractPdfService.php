<?php

namespace Taily\Support;

use Barryvdh\DomPDF\Facade\Pdf;
use Barryvdh\DomPDF\PDF as PdfWrapper;
use Dompdf\Dompdf;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use setasign\Fpdi\Fpdi;
use setasign\Fpdi\PdfParser\StreamReader;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Taily\Enums\ContractSignerRole;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\ContractSigningProcess;

class ContractPdfService
{
    /**
     * dompdf caches the metrics of every `@font-face` the contract layout
     * registers as a file in its font directory, and aborts the render if it
     * cannot write them. No Laravel installation ships that directory, so
     * creating it is part of being able to render at all — cheap enough to
     * do on construction, since this service is only built to produce a
     * contract in the first place.
     */
    public function __construct()
    {
        File::ensureDirectoryExists(config('dompdf.options.font_dir', storage_path('fonts')));
    }

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
        $pdf = $this->render($this->renderBody($adoption, $templateKey));
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
        $appendix = $this->render($this->renderAppendix($process))->output();

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
     * Hand $html to dompdf, subsetting the fonts the layout embeds.
     *
     * laravel-dompdf ships with font subsetting off, which writes a complete
     * copy of every embedded face into every document — several hundred KB
     * around a contract whose own content is a few KB, stored once per
     * contract and again per frozen and final artifact. Subsetting carries
     * only the glyphs a document actually uses. It is set per render rather
     * than in a published dompdf config, so nothing here depends on an
     * installation's own PDF settings.
     */
    private function render(string $html): PdfWrapper
    {
        return Pdf::setOption('enable_font_subsetting', true)->loadHtml($html);
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
        $media = $animal->getProfilePictureMedia();

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
     * is being laid out (its {PAGE_NUM}/{PAGE_COUNT} placeholders only work
     * through the PHP-eval mode or this canvas API), so the template itself
     * can't render this. The canvas-level page_text() API is the documented
     * way to do it without enabling isPhpEnabled, which would otherwise
     * broaden dompdf's execution surface for a template that has no other
     * reason to run embedded PHP: it defers drawing until every page
     * exists, then substitutes the placeholders per page.
     *
     * Positioned to line up with the footer band rendered by the template
     * itself (see the `.page-footer` rule in contracts/layout.blade.php) — same
     * right margin, same type size, sitting on the band's first line to the
     * right of the organisation's contact details — so it reads as one
     * footer rather than two independently-placed pieces of text.
     */
    private function stampPageNumbers(Dompdf $dompdf): void
    {
        $canvas = $dompdf->getCanvas();
        $fontMetrics = $dompdf->getFontMetrics();

        // The body font the layout registers, so the stamp is set in the
        // same type as the footer lines it sits beside. A layout that drops
        // the @font-face rules falls back to the core font rather than to
        // dompdf's default, which is what this text used to be set in.
        $font = $fontMetrics->getFont('Public Sans') ?? $fontMetrics->getFont('Helvetica');

        // The template's own footer measurements, converted from CSS px to
        // the points this canvas works in (dompdf converts at 0.75): the
        // 40px side margin and the 9px font size. $topOffset is measured
        // from the sheet's top edge down to the text's top rather than its
        // baseline, which is why it exceeds by about one ascent the 37.3pt
        // above the bottom edge where the band's first line sits. Move the
        // band in the template and these three have to move with it.
        $fontSize = 6.75;
        $margin = 30.0;
        $topOffset = 43.5;

        $text = 'Seite {PAGE_NUM} von {PAGE_COUNT}';
        // {PAGE_NUM}/{PAGE_COUNT} are only substituted with the real
        // numbers once every page exists, so the width is measured against
        // a same-length placeholder to right-align consistently.
        $textWidth = (float) $fontMetrics->getTextWidth('Seite 00 von 00', $font, $fontSize);

        $x = (float) $canvas->get_width() - $margin - $textWidth;
        $y = (float) $canvas->get_height() - $topOffset;

        $canvas->page_text($x, $y, $text, $font, $fontSize, [0.169, 0.165, 0.133]);
    }
}
