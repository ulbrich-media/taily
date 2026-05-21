<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Taily\Http\Controllers\Controller;
use Taily\Http\Resources\AdoptionDetailResource;
use Taily\Models\Adoption;

class AdoptionContractController extends Controller
{
    private const DETAIL_RELATIONS = [
        'animal', 'animal.animalType', 'animal.media',
        'mediator', 'mediator.media',
        'applicant', 'applicant.media',
        'media',
    ];

    public function store(Request $request, Adoption $adoption): JsonResponse
    {
        // multiform data needs us to convert an empty date string to null
        $request->merge([
            'contract_signed_at' => $request->input('contract_signed_at') ?: null,
        ]);

        $validated = $request->validate([
            'contract_signed' => 'required|boolean',
            'contract_signed_at' => 'sometimes|nullable|date',
            'file' => 'sometimes|nullable|file|max:20480',
            'remove_file' => 'sometimes|boolean',
        ]);

        $adoption->contract_signed = $request->boolean('contract_signed');

        if ($request->has('contract_signed_at')) {
            $adoption->contract_signed_at = $validated['contract_signed_at'];
        }

        $adoption->save();

        if ($request->hasFile('file')) {
            $adoption->clearMediaCollection('contract');
            $adoption->addMedia($request->file('file'))->toMediaCollection('contract');
        } elseif ($request->boolean('remove_file')) {
            $adoption->clearMediaCollection('contract');
        }

        $adoption->load(self::DETAIL_RELATIONS);

        return response()->json([
            'message' => 'Schutzvertrag erfolgreich gespeichert.',
            'data' => new AdoptionDetailResource($adoption),
        ]);
    }
}
