<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Taily\Http\Controllers\Controller;
use Taily\Http\Resources\TransportListResource;
use Taily\Models\Transport;

class TransportController extends Controller
{
    private const LIST_RELATIONS = [
        'responsible', 'responsible.media',
        'adoptions',
        'adoptions.animal', 'adoptions.animal.animalType', 'adoptions.animal.media',
        'adoptions.mediator', 'adoptions.mediator.media',
        'adoptions.applicant', 'adoptions.applicant.media',
        'adoptions.media',
    ];

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Transport::with(self::LIST_RELATIONS);

        if ($request->has('is_done')) {
            $isDone = filter_var($request->query('is_done'), FILTER_VALIDATE_BOOLEAN);

            if ($isDone) {
                $query->whereNotNull('done_at')
                    ->orderBy('done_at', 'desc');
            } else {
                $query->whereNull('done_at')
                    ->orderByRaw('planned_at IS NULL')
                    ->orderBy('planned_at', 'asc');
            }
        } else {
            $query->orderByRaw('planned_at IS NULL')
                ->orderBy('planned_at', 'desc')
                ->orderBy('created_at', 'desc');
        }

        return TransportListResource::collection($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'planned_at' => 'nullable|date',
            'notes' => 'sometimes|string',
            'responsible_id' => 'sometimes|nullable|uuid|exists:people,id',
            'transporter' => 'sometimes|string|max:255',
        ]);

        $transport = Transport::create($validated);
        $transport->load(self::LIST_RELATIONS);

        return response()->json([
            'message' => 'Transport erfolgreich angelegt.',
            'data' => new TransportListResource($transport),
        ], 201);
    }

    public function update(Request $request, Transport $transport): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'planned_at' => 'sometimes|nullable|date',
            'notes' => 'sometimes|string',
            'responsible_id' => 'sometimes|nullable|uuid|exists:people,id',
            'transporter' => 'sometimes|string|max:255',
        ]);

        $transport->update($validated);
        $transport->load(self::LIST_RELATIONS);

        return response()->json([
            'message' => 'Transport erfolgreich aktualisiert.',
            'data' => new TransportListResource($transport),
        ]);
    }

    public function destroy(Transport $transport): JsonResponse
    {
        $transport->delete();

        return response()->json([
            'message' => 'Transport erfolgreich gelöscht.',
        ]);
    }

    public function markDone(Request $request, Transport $transport): JsonResponse
    {
        if ($transport->isDone()) {
            return response()->json([
                'message' => 'Transport ist bereits abgeschlossen.',
            ], 422);
        }

        $validated = $request->validate([
            'done_at' => 'nullable|date|before_or_equal:today',
        ]);

        $transport->done_at = $validated['done_at'] ?? now();
        $transport->save();
        $transport->load(self::LIST_RELATIONS);

        return response()->json([
            'message' => 'Transport erfolgreich abgeschlossen.',
            'data' => new TransportListResource($transport),
        ]);
    }
}
