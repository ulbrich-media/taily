<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Taily\Http\Controllers\Controller;
use Taily\Http\Resources\TransportDetailResource;
use Taily\Http\Resources\TransportListResource;
use Taily\Models\Transport;

class TransportController extends Controller
{
    private const LIST_RELATIONS = ['adoptions'];

    private const DETAIL_RELATIONS = ['adoptions', 'adoptions.animal', 'adoptions.applicant'];

    public function index(): AnonymousResourceCollection
    {
        $transports = Transport::with(self::LIST_RELATIONS)
            ->orderByRaw('planned_at IS NULL')
            ->orderBy('planned_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return TransportListResource::collection($transports);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'planned_at' => 'nullable|date',
            'notes' => 'sometimes|string',
        ]);

        $transport = Transport::create($validated);
        $transport->load(self::DETAIL_RELATIONS);

        return response()->json([
            'message' => 'Transport erfolgreich angelegt.',
            'data' => new TransportDetailResource($transport),
        ], 201);
    }

    public function show(Transport $transport): TransportDetailResource
    {
        $transport->load(self::DETAIL_RELATIONS);

        return new TransportDetailResource($transport);
    }

    public function update(Request $request, Transport $transport): JsonResponse
    {
        $validated = $request->validate([
            'planned_at' => 'sometimes|nullable|date',
            'notes' => 'sometimes|string',
        ]);

        $transport->update($validated);
        $transport->load(self::DETAIL_RELATIONS);

        return response()->json([
            'message' => 'Transport erfolgreich aktualisiert.',
            'data' => new TransportDetailResource($transport),
        ]);
    }

    public function destroy(Transport $transport): JsonResponse
    {
        $transport->delete();

        return response()->json([
            'message' => 'Transport erfolgreich gelöscht.',
        ]);
    }

    public function markDone(Transport $transport): JsonResponse
    {
        if ($transport->isDone()) {
            return response()->json([
                'message' => 'Transport ist bereits abgeschlossen.',
            ], 422);
        }

        $transport->done_at = now();
        $transport->save();
        $transport->load(self::DETAIL_RELATIONS);

        return response()->json([
            'message' => 'Transport erfolgreich abgeschlossen.',
            'data' => new TransportDetailResource($transport),
        ]);
    }
}
