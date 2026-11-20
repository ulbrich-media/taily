<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Taily\Http\Controllers\Controller;
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
            'status' => $export->status(),
        ];
    }
}
