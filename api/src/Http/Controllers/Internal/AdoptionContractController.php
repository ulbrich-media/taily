<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Taily\Http\Controllers\Controller;
use Taily\Models\Adoption;

class AdoptionContractController extends Controller
{
    public function store(Request $request, Adoption $adoption): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:20480',
        ]);

        $adoption->clearMediaCollection('contract');
        $media = $adoption->addMedia($request->file('file'))->toMediaCollection('contract');

        return response()->json([
            'message' => 'Vertragsdatei erfolgreich hochgeladen.',
            'data' => [
                'uuid' => $media->uuid,
                'name' => $media->file_name,
                'url' => $media->getTemporaryUrl(now()->addHour()),
            ],
        ], 201);
    }

    public function destroy(Adoption $adoption): JsonResponse
    {
        $adoption->clearMediaCollection('contract');

        return response()->json([
            'message' => 'Vertragsdatei erfolgreich entfernt.',
        ]);
    }
}
