<?php

namespace Taily\Support;

use Barryvdh\DomPDF\Facade\Pdf;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Taily\Enums\ContractSignerRole;
use Taily\Models\Adoption;
use Taily\Models\ContractSigningProcess;

class ContractPdfService
{
    /**
     * Render the given adoption's contract template to unsigned PDF bytes.
     *
     * @throws NotFoundHttpException if the template key is unknown.
     */
    public function generate(Adoption $adoption, string $templateKey): string
    {
        [$view, $data] = $this->resolveViewAndData($adoption, $templateKey);

        return Pdf::loadView($view, $data)->output();
    }

    /**
     * Re-render the same template as generate(), this time with both
     * signers' typed names filled into the signature block and an audit
     * trail appendix included — the final artifact once signing completes.
     * Templates opt into rendering signatures/the audit trail themselves
     * (see contracts/default.blade.php); see ADR-013.
     *
     * @throws NotFoundHttpException if the process's template key is unknown.
     */
    public function generateFinal(ContractSigningProcess $process): string
    {
        $process->loadMissing(['signers.person', 'auditEvents.signer.person']);

        [$view, $data] = $this->resolveViewAndData($process->adoption, $process->template_key);

        return Pdf::loadView($view, [
            ...$data,
            'mediatorSigner' => $process->signers->firstWhere('role', ContractSignerRole::MEDIATOR),
            'adopterSigner' => $process->signers->firstWhere('role', ContractSignerRole::ADOPTER),
            'auditEvents' => $process->auditEvents,
            'includeAuditTrail' => true,
        ])->output();
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
