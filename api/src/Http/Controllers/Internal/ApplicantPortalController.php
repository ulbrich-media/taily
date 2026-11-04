<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Taily\Http\Controllers\Controller;
use Taily\Models\Adoption;
use Taily\Models\ApplicantSession;
use Taily\Support\ApplicantPortal;

/**
 * The applicant portal: logging in by email and magic link, the applicant's
 * adoptions, and editing their data. A portal session is sent as a bearer
 * token; it has nothing to do with the admin login.
 */
class ApplicantPortalController extends Controller
{
    public function __construct(
        private ApplicantPortal $portal,
    ) {}

    public function requestLogin(Request $request): JsonResponse
    {
        $validated = $request->validate(['email' => ['required', 'email', 'max:255']]);

        $this->portal->requestLogin($validated['email']);

        // The same answer either way: nobody learns whether an address is known.
        return response()->json([
            'message' => 'Falls es Bewerbungen zu dieser Adresse gibt, haben wir dir einen Link geschickt.',
        ]);
    }

    public function login(string $token): JsonResponse
    {
        $session = $this->portal->login($token);

        abort_if($session === null, 404, 'Dieser Link ist ungültig, abgelaufen oder wurde bereits verwendet.');

        return response()->json(['session_token' => $session]);
    }

    public function logout(Request $request): JsonResponse
    {
        ApplicantSession::findValid($request->bearerToken())?->delete();

        return response()->json(['message' => 'Abgemeldet.']);
    }

    public function index(Request $request): JsonResponse
    {
        $session = $this->session($request);

        $adoptions = $this->portal->adoptionsOf($session->email)
            ->with(['animal.animalType', 'animal.media', 'preInspections', 'transport', 'latestContractSigningProcess'])
            ->latest()
            ->get();

        return response()->json([
            'email' => $session->email,
            'adoptions' => $adoptions->map(fn (Adoption $adoption) => collect($this->portal->present($adoption))
                ->only(['id', 'status', 'created_at', 'animal', 'current_step', 'editable'])
                ->all()),
        ]);
    }

    public function show(Request $request, string $adoption): JsonResponse
    {
        return response()->json($this->portal->present($this->adoption($request, $adoption)));
    }

    public function update(Request $request, string $adoption): JsonResponse
    {
        $adoption = $this->adoption($request, $adoption);
        $validated = $request->validate(['values' => ['required', 'array']]);

        $this->portal->update($adoption, $validated['values']);

        return response()->json([
            'message' => 'Deine Angaben sind gespeichert.',
            'data' => $this->portal->present($adoption->fresh()),
        ]);
    }

    private function session(Request $request): ApplicantSession
    {
        return ApplicantSession::findValid($request->bearerToken())
            ?? abort(401, 'Bitte melde dich erneut an.');
    }

    /**
     * Only adoptions of the session's email; anything else is "not found".
     */
    private function adoption(Request $request, string $id): Adoption
    {
        return $this->portal->adoptionsOf($this->session($request)->email)->whereKey($id)->firstOrFail();
    }
}
