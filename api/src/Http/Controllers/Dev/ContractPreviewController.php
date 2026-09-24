<?php

namespace Taily\Http\Controllers\Dev;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Taily\Enums\ContractSigningStatus;
use Taily\Http\Controllers\Controller;
use Taily\Models\Adoption;
use Taily\Models\ContractSigningProcess;
use Taily\Support\ContractPdfService;
use Taily\Support\ContractSigningService;

/**
 * Renders a contract on every request, so working on either Blade template
 * is an edit-and-reload loop in the browser rather than a signing flow
 * driven by hand: generate, open the mediator's mail, sign, open the
 * adopter's mail, sign, download.
 *
 * Dev-only, behind three independent gates, because it renders an
 * adoption's full personal data:
 *
 * 1. the route is registered in local and testing environments only (see
 *    TailyServiceProvider::registerRoutes());
 * 2. __invoke() repeats that environment check at request time, so the
 *    endpoint stays closed even if a consuming app's route cache or config
 *    ever carried it somewhere it shouldn't be;
 * 3. it requires a logged-in user.
 *
 * The session guard, not `auth:sanctum`, is what checks (3): this URL is
 * meant to be typed or bookmarked, and Sanctum only consults the session
 * for requests it recognizes as coming from the frontend, which it decides
 * from the Referer/Origin header — absent on a hand-typed navigation. See
 * AdoptionContractController::generate() for the same constraint. Being
 * logged into the admin SPA in the same browser is therefore enough, and
 * nothing else is.
 *
 * Every gate answers 404 rather than 401 or a redirect: the endpoint should
 * not advertise itself, and this app has no `login` route to redirect to.
 */
class ContractPreviewController extends Controller
{
    public function __invoke(Request $request, ContractPdfService $pdfService, ContractSigningService $signingService): Response
    {
        abort_unless(app()->environment(self::ENVIRONMENTS), 404);
        abort_unless(Auth::guard('web')->check(), 404);

        $templateKey = (string) $request->query('template', 'default');

        abort_unless(
            array_key_exists($templateKey, config('taily.contracts', [])),
            404,
            "Unknown template key '{$templateKey}'. Available: ".implode(', ', array_keys(config('taily.contracts', []))),
        );

        $adoption = $this->resolveAdoption($request);

        // Two independent flags rather than one mode parameter, so every
        // combination is a URL you can bookmark and reload:
        //   ?              the contract body, as the Generate step renders it
        //   ?signed        that body with the signature/audit-trail appendix
        //   ?html          the body's HTML, for a faster layout loop
        //   ?signed&html   the appendix's HTML, same reason
        $signed = $request->has('signed');
        $html = $request->has('html');

        if ($signed) {
            return $this->withProcess($adoption, $signingService, $pdfService, $templateKey, $html);
        }

        return $html
            ? $this->html($pdfService->renderBody($adoption, $templateKey))
            : $this->pdf($pdfService->generate($adoption, $templateKey));
    }

    /**
     * Environments the preview is available in. Testing is included so the
     * endpoint's own tests can reach it; it is never a served environment.
     */
    public const ENVIRONMENTS = ['local', 'testing'];

    /**
     * The adoption named by ?adoption=, or the newest one in the database.
     */
    private function resolveAdoption(Request $request): Adoption
    {
        $query = Adoption::with(['animal.animalType', 'mediator.organization', 'applicant']);

        if ($id = $request->query('adoption')) {
            return $query->whereKey($id)->firstOrFail();
        }

        $adoption = $query->latest('created_at')->first();

        abort_if($adoption === null, 404, 'No adoptions in the database. Seed one first: ddev artisan taily:seed');

        return $adoption;
    }

    /**
     * Renders the variant that needs a signing process, using the adoption's
     * own completed one where there is one.
     */
    private function withProcess(
        Adoption $adoption,
        ContractSigningService $signingService,
        ContractPdfService $pdfService,
        string $templateKey,
        bool $html,
    ): Response {
        $process = $adoption->contractSigningProcesses()
            ->where('status', ContractSigningStatus::COMPLETED)
            ->latest('completed_at')
            ->first();

        if ($process) {
            return $html
                ? $this->html($pdfService->renderAppendix($process))
                : $this->pdf($pdfService->appendSignaturePages($pdfService->generate($adoption, $templateKey), $process));
        }

        return $this->withDemoProcess(
            $adoption,
            $signingService,
            $pdfService,
            $templateKey,
            fn (ContractSigningProcess $demo, string $body) => $html
                ? $this->html($pdfService->renderAppendix($demo))
                : $this->pdf($pdfService->appendSignaturePages($body, $demo)),
        );
    }

    /**
     * Runs $callback against a fully signed, finalized signing process built
     * from the adoption's real mediator and applicant, then rolls every row
     * it wrote back out of the database.
     *
     * Driving the real ContractSigningService rather than hand-building the
     * models means the preview shows the events the service actually writes,
     * in the order it writes them — a fabricated trail would drift from the
     * real one silently, which is the opposite of what a preview is for.
     *
     * The frozen PDF that start() stores is a media write, which a rollback
     * would leave behind as an orphan file — hence the faked disk, which
     * lives under storage/framework/testing and is disposable by definition.
     * It is also seeded with the body rendered here, so the document hash
     * shown in the appendix is that body's real hash.
     */
    private function withDemoProcess(
        Adoption $adoption,
        ContractSigningService $signingService,
        ContractPdfService $pdfService,
        string $templateKey,
        callable $callback,
    ): Response {
        abort_if(
            $adoption->mediator === null || $adoption->applicant === null,
            404,
            'This adoption needs both a mediator and an applicant to synthesize a signing process. Pass ?adoption= with one that has both.',
        );

        $body = $pdfService->generate($adoption, $templateKey);

        Storage::fake('contract-signing-document');

        DB::beginTransaction();

        try {
            $process = $signingService->start($adoption, $templateKey, $body);

            $signingService->recordMediatorSignature($process, $adoption->mediator->full_name, true, true, true, '192.0.2.10', 'ContractPreview');
            $signingService->recordAdopterSignature($process, $adoption->applicant->full_name, true, true, true, '192.0.2.20', 'ContractPreview');
            $signingService->finalize($process, str_repeat('0', 64));

            return $callback($process->fresh(), $body);
        } finally {
            DB::rollBack();
        }
    }

    private function pdf(string $bytes): Response
    {
        return response($bytes, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="contract-preview.pdf"',
            'Cache-Control' => 'no-store',
        ]);
    }

    private function html(string $markup): Response
    {
        return response($markup, 200, [
            'Content-Type' => 'text/html; charset=utf-8',
            'Cache-Control' => 'no-store',
        ]);
    }
}
