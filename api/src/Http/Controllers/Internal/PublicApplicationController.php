<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Taily\Http\Controllers\Controller;
use Taily\Models\Animal;
use Taily\Support\ApplicantPortal;

/**
 * The public application form of one animal. Reached only through the link
 * copied from the animal's admin page; there is no public listing.
 */
class PublicApplicationController extends Controller
{
    public function __construct(
        private ApplicantPortal $portal,
    ) {}

    public function show(Animal $animal): JsonResponse
    {
        $animal->load(['animalType', 'media']);

        return response()->json([
            'animal' => [
                'name' => $animal->name,
                'animal_type' => $animal->animalType?->title,
                'picture_url' => $animal->getProfilePictureMedia()?->getTemporaryUrl(now()->addHour(), 'thumbnail'),
                'is_reserved' => (bool) $animal->is_reserved,
            ],
            'accepts_applications' => $this->portal->acceptsApplications($animal),
            ...$this->portal->applicationForm($animal),
        ]);
    }

    public function store(Request $request, Animal $animal): JsonResponse
    {
        $validated = $request->validate(['values' => ['required', 'array']]);

        $this->portal->apply($animal, $validated['values']);

        return response()->json([
            'message' => 'Bitte bestätige deine Bewerbung über den Link in der E-Mail, die wir dir gerade geschickt haben.',
        ], 201);
    }

    public function confirm(string $token): JsonResponse
    {
        $session = $this->portal->confirm($token);

        abort_if($session === null, 404, 'Dieser Link ist ungültig, abgelaufen oder wurde bereits verwendet.');

        return response()->json([
            'message' => 'Deine Bewerbung ist bestätigt.',
            'session_token' => $session,
        ]);
    }
}
