<?php

namespace Taily\Support;

use Barryvdh\DomPDF\Facade\Pdf;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Taily\Models\Adoption;

class ContractPdfService
{
    /**
     * Render the given adoption's contract template to PDF bytes.
     *
     * @throws NotFoundHttpException if the template key is unknown.
     */
    public function generate(Adoption $adoption, string $templateKey): string
    {
        // Indexed directly (not via the "taily.contracts.{$templateKey}" dot
        // path) so a configured key containing a dot, e.g. "regional.v1",
        // resolves to itself instead of being parsed as a nested path.
        $templates = config('taily.contracts', []);
        $template = $templates[$templateKey] ?? null;

        abort_if($template === null, 404, 'Unbekannte Vertragsvorlage.');

        $adoption->load(['animal.animalType', 'mediator.organization', 'applicant']);

        $data = [
            'adoption' => $adoption,
            'animal' => $adoption->animal,
            'applicant' => $adoption->applicant,
            'mediator' => $adoption->mediator,
            'organization' => $adoption->mediator?->organization,
        ];

        return Pdf::loadView("taily::{$template['view']}", $data)->output();
    }

    /**
     * Build a download filename for the given adoption's contract PDF.
     */
    public function filename(Adoption $adoption): string
    {
        $animalName = str($adoption->animal?->name ?? 'Tier')->slug();

        return "schutzvertrag-{$animalName}-{$adoption->id}.pdf";
    }
}
