<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Taily\Enums\AdoptionStep;
use Taily\Http\Controllers\Controller;
use Taily\Http\Resources\TransportListResource;
use Taily\Models\Adoption;
use Taily\Models\Transport;
use Taily\Support\CaseFile\CaseFileService;

class TransportController extends Controller
{
    private const LIST_RELATIONS = [
        'responsible', 'responsible.media',
        'adoptions',
        'adoptions.animal', 'adoptions.animal.animalType', 'adoptions.animal.media',
        'adoptions.mediator', 'adoptions.mediator.media',
        'adoptions.applicantPerson', 'adoptions.applicantPerson.media',
        'adoptions.media',
    ];

    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'is_done' => 'nullable|boolean',
        ]);

        $query = Transport::with(self::LIST_RELATIONS);

        if ($request->has('is_done')) {
            if ($request->boolean('is_done')) {
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

    /**
     * The transport-step checklist of every adoption on this run, so the
     * mediator sees what is missing without opening each adoption
     * (docs/features/transport.md#checklist).
     */
    public function checklist(Transport $transport, CaseFileService $caseFile): JsonResponse
    {
        $adoptions = $transport->adoptions()
            ->with(['animal', 'mediator', 'fieldValues', 'requirements'])
            ->get()
            ->sortBy(fn (Adoption $adoption) => $adoption->animal?->name)
            ->values();

        $rows = $adoptions->map(fn (Adoption $adoption) => [
            'adoption_id' => $adoption->id,
            'animal' => ['id' => $adoption->animal_id, 'name' => $adoption->animal?->name],
            'applicant' => ['person_id' => $adoption->applicant_person_id, 'full_name' => $adoption->applicant_full_name],
            'checklist' => $caseFile->checklist($adoption, AdoptionStep::TRANSPORT)->toArray(),
        ]);

        return response()->json([
            'complete' => $rows->filter(fn (array $row) => $row['checklist']['complete'])->count(),
            'total' => $rows->count(),
            'adoptions' => $rows,
        ]);
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
        $validated = $request->validate([
            'done_at' => 'nullable|date|before_or_equal:today',
        ]);

        $doneAt = $validated['done_at'] ?? now();

        $affected = Transport::whereKey($transport->id)
            ->whereNull('done_at')
            ->update(['done_at' => $doneAt]);

        if ($affected === 0) {
            return response()->json([
                'message' => 'Transport ist bereits abgeschlossen.',
            ], 422);
        }

        $transport->refresh();
        $transport->load(self::LIST_RELATIONS);

        return response()->json([
            'message' => 'Transport erfolgreich abgeschlossen.',
            'data' => new TransportListResource($transport),
        ]);
    }
}
