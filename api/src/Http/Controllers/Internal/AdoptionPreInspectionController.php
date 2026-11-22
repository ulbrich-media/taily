<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Taily\Http\Controllers\Controller;
use Taily\Http\Resources\AdoptionDetailResource;
use Taily\Models\Adoption;

/**
 * The mediator's confirmation that closes the pre-inspection step — with or
 * without a pre-inspection, and regardless of its verdict. A rejection is a
 * cancellation of the adoption, not a state of this step.
 */
class AdoptionPreInspectionController extends Controller
{
    public function confirm(Request $request, Adoption $adoption): JsonResponse
    {
        $adoption->pre_inspection_confirmed_at = now();
        $adoption->pre_inspection_confirmed_by = $request->user()->id;
        $adoption->save();

        return $this->respond($adoption, 'Vorkontrolle bestätigt.');
    }

    public function unconfirm(Adoption $adoption): JsonResponse
    {
        $adoption->pre_inspection_confirmed_at = null;
        $adoption->pre_inspection_confirmed_by = null;
        $adoption->save();

        return $this->respond($adoption, 'Bestätigung der Vorkontrolle zurückgenommen.');
    }

    private function respond(Adoption $adoption, string $message): JsonResponse
    {
        $adoption->load(AdoptionController::DETAIL_RELATIONS);

        return response()->json([
            'message' => $message,
            'data' => new AdoptionDetailResource($adoption),
        ]);
    }
}
