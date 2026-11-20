<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Taily\Http\Controllers\Controller;
use Taily\Models\TiervermittlungListing;
use Taily\Support\Tiervermittlung\CompatibilityMapping;
use Taily\Support\Tiervermittlung\TiervermittlungExport;

/**
 * Export configuration (one section per export target) and the read-only
 * status of the export. Everyone signed in may look, only admins may change.
 */
class ExportSettingsController extends Controller
{
    public function __construct()
    {
        $this->middleware('admin')->only(['update']);
    }

    public function show(CompatibilityMapping $mapping, TiervermittlungExport $export): JsonResponse
    {
        return response()->json($this->payload($mapping, $export));
    }

    public function update(Request $request, CompatibilityMapping $mapping, TiervermittlungExport $export): JsonResponse
    {
        $validated = $request->validate([
            'compatibleWith' => 'required|array',
            'compatibleWith.children' => 'present|array',
            'compatibleWith.children.*' => 'string|max:255',
            'compatibleWith.dogs' => 'present|array',
            'compatibleWith.dogs.*' => 'string|max:255',
            'compatibleWith.cats' => 'present|array',
            'compatibleWith.cats.*' => 'string|max:255',
        ]);

        $mapping->save($validated['compatibleWith']);

        return response()->json([
            'message' => 'Export-Einstellungen gespeichert.',
            ...$this->payload($mapping, $export),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(CompatibilityMapping $mapping, TiervermittlungExport $export): array
    {
        return [
            'compatibleWith' => $mapping->get(),
            'status' => $this->status($export),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function status(TiervermittlungExport $export): array
    {
        $counts = TiervermittlungListing::query()
            ->whereNotNull('animal_id')
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        // Animals that are exported but have no accepted delivery yet.
        $notDelivered = $export->exportableAnimals()
            ->filter(fn ($animal) => $animal->tiervermittlungListing === null || $animal->tiervermittlungListing->status === '')
            ->count();

        $attention = TiervermittlungListing::query()
            ->with('animal:id,name,animal_type_id')
            ->whereNotNull('animal_id')
            ->whereIn('status', [TiervermittlungListing::STATUS_REJECTED, 'nicht_veroeffentlicht'])
            ->orderBy('status')
            ->get()
            ->map(fn (TiervermittlungListing $listing) => [
                'animal_id' => $listing->animal_id,
                'animal_type_id' => $listing->animal?->animal_type_id,
                'name' => $listing->animal?->name,
                'status' => $listing->status,
            ])
            ->values();

        return [
            'enabled' => TiervermittlungExport::isEnabled(),
            'api_key_configured' => (string) config('taily.tiervermittlung.api_key') !== '',
            'listings' => [
                'veroeffentlicht' => (int) ($counts['veroeffentlicht'] ?? 0),
                'nicht_veroeffentlicht' => (int) ($counts['nicht_veroeffentlicht'] ?? 0),
                'doppelt' => (int) ($counts['doppelt'] ?? 0),
                'abgelehnt' => (int) ($counts[TiervermittlungListing::STATUS_REJECTED] ?? 0),
                'not_delivered' => $notDelivered,
            ],
            'last_delivery_at' => TiervermittlungListing::query()
                ->whereNotNull('last_sent_at')
                ->where(fn ($query) => $query->where('last_error', '')->orWhereNull('last_error'))
                ->orderByDesc('last_sent_at')
                ->first()
                ?->last_sent_at
                ?->toIso8601String(),
            'attention' => $attention,
        ];
    }
}
