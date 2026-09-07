<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Taily\Enums\ContractSignerRole;
use Taily\Exceptions\ContractSigningStateException;
use Taily\Http\Controllers\Controller;
use Taily\Mail\ContractSignerInviteMail;
use Taily\Models\ContractSigner;
use Taily\Models\ContractSigningProcess;
use Taily\Support\ContractCompletionService;
use Taily\Support\ContractSigningService;
use Throwable;

class ContractSigningSubmissionController extends Controller
{
    private const GENERIC_ERROR = 'Dieser Link ist ungültig, abgelaufen oder wurde bereits verwendet.';

    public function __construct(
        private ContractSigningService $signingService,
        private ContractCompletionService $completionService,
    ) {}

    /**
     * Display the frozen contract plus review context for public token access.
     */
    public function show(Request $request, string $token): JsonResponse
    {
        $signer = ContractSigner::findByToken($token);

        if (! $signer) {
            return $this->notFound();
        }

        $signer->load([
            'person',
            'signingProcess.adoption.animal.animalType',
            'signingProcess.adoption.mediator',
            'signingProcess.adoption.applicant',
            'signingProcess.signers.person',
        ]);

        // Recorded on every view, including repeat views — see docs/features/contract.md#audit-trail.
        $this->signingService->recordLinkOpened($signer, (string) $request->ip(), (string) $request->userAgent());

        $process = $signer->signingProcess;
        $adoption = $process->adoption;
        $otherRole = $signer->role === ContractSignerRole::MEDIATOR ? ContractSignerRole::ADOPTER : ContractSignerRole::MEDIATOR;
        $otherSigner = $process->signers->firstWhere('role', $otherRole);

        return response()->json([
            'role' => $signer->role,
            'animal' => [
                'name' => $adoption->animal->name,
                'animal_type' => $adoption->animal->animalType?->title,
            ],
            'mediator' => ['full_name' => $adoption->mediator?->full_name],
            'applicant' => ['full_name' => $adoption->applicant->full_name],
            'other_signer' => ($otherSigner && $otherSigner->isSigned()) ? [
                'role' => $otherSigner->role,
                'typed_name' => $otherSigner->typed_name,
                'signed_at' => $otherSigner->signed_at,
            ] : null,
        ]);
    }

    /**
     * Streams the frozen, unsigned PDF for the review page's embedded viewer.
     */
    public function document(string $token): Response|JsonResponse
    {
        $signer = ContractSigner::findByToken($token);

        if (! $signer) {
            return $this->notFound();
        }

        $media = $signer->signingProcess->getFirstMedia('document');

        if (! $media) {
            return $this->notFound();
        }

        $bytes = Storage::disk($media->disk)->get($media->getPathRelativeToRoot());

        return response($bytes, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="vertrag.pdf"',
            'Cache-Control' => 'no-store',
        ]);
    }

    /**
     * Submit the typed-name-and-checkboxes signature via public token. The
     * token alone identifies the record acted on — no separate ID parameter.
     */
    public function submit(Request $request, string $token): JsonResponse
    {
        $validated = $request->validate([
            'typed_name' => 'required|string|max:255',
            'contract_content_accepted' => 'required|accepted',
            'privacy_policy_accepted' => 'required|accepted',
            'information_confirmed' => 'required|accepted',
        ]);

        $signer = ContractSigner::findByToken($token);

        if (! $signer) {
            return $this->notFound();
        }

        $ip = (string) $request->ip();
        $userAgent = (string) $request->userAgent();

        try {
            if ($signer->role === ContractSignerRole::MEDIATOR) {
                $this->signingService->recordMediatorSignature(
                    $signer->signingProcess,
                    $validated['typed_name'],
                    true,
                    true,
                    true,
                    $ip,
                    $userAgent,
                );

                $this->notifyAdopter($signer->signingProcess->fresh());
            } else {
                $this->signingService->recordAdopterSignature(
                    $signer->signingProcess,
                    $validated['typed_name'],
                    true,
                    true,
                    true,
                    $ip,
                    $userAgent,
                );

                $this->completionService->complete($signer->signingProcess->fresh());
            }
        } catch (ContractSigningStateException) {
            return $this->notFound();
        }

        return response()->json(['message' => 'Unterschrift erfolgreich übermittelt.']);
    }

    private function notifyAdopter(ContractSigningProcess $process): void
    {
        $adopterSigner = $process->signers()->where('role', ContractSignerRole::ADOPTER)->with('person')->firstOrFail();

        if (! $adopterSigner->person->email) {
            return;
        }

        try {
            Mail::to($adopterSigner->person->email)->send(
                new ContractSignerInviteMail($adopterSigner, $adopterSigner->activeToken()->token)
            );
            $this->signingService->recordEmailSent($adopterSigner);
        } catch (Throwable $e) {
            // The mediator's signature is already committed at this point,
            // so a mail delivery failure must not turn into a 500 here.
            Log::error('Failed to send contract signer invite to adopter', [
                'signing_process_id' => $process->id,
                'exception' => $e,
            ]);
        }
    }

    private function notFound(): JsonResponse
    {
        return response()->json(['message' => self::GENERIC_ERROR], 404);
    }
}
