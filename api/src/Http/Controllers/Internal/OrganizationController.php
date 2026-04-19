<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Taily\Http\Controllers\Controller;
use Taily\Http\Resources\OrganizationResource;
use Taily\Models\Organization;

class OrganizationController extends Controller
{
    /**
     * Display a listing of organizations.
     */
    public function index(): JsonResponse
    {
        $organizations = Organization::withCount('people')
            ->orderBy('name')
            ->get();

        return response()->json(OrganizationResource::collection($organizations));
    }

    /**
     * Store a newly created organization in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'street_line' => 'string|max:255',
            'street_line_additional' => 'string|max:255',
            'postal_code' => 'string|max:255',
            'city' => 'string|max:255',
            'country_code' => 'string|size:2',
            'phone' => 'nullable|string|max:255',
            'mobile' => 'nullable|string|max:255',
        ]);

        $organization = Organization::create($validated);

        return response()->json([
            'message' => 'Organisation erfolgreich angelegt.',
            'data' => new OrganizationResource($organization),
        ], 201);
    }

    /**
     * Display the specified organization.
     */
    public function show(Organization $organization): JsonResponse
    {
        $organization->loadCount('people');

        return response()->json(new OrganizationResource($organization));
    }

    /**
     * Update the specified organization in storage.
     */
    public function update(Request $request, Organization $organization): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|nullable|email|max:255',
            'street_line' => 'string|max:255',
            'street_line_additional' => 'string|max:255',
            'postal_code' => 'string|max:255',
            'city' => 'string|max:255',
            'country_code' => 'string|size:2',
            'phone' => 'sometimes|nullable|string|max:255',
            'mobile' => 'sometimes|nullable|string|max:255',
        ]);

        $organization->update($validated);

        return response()->json([
            'message' => 'Organisation erfolgreich aktualisiert.',
            'data' => new OrganizationResource($organization),
        ]);
    }

    /**
     * Remove the specified organization from storage.
     */
    public function destroy(Organization $organization): JsonResponse
    {
        // Check if there are any people assigned to this organization
        if ($organization->people()->count() > 0) {
            return response()->json([
                'message' => 'Die Organisation kann nicht gelöscht werden, da ihr noch Personen zugeordnet sind.',
            ], 422);
        }

        $organization->delete();

        return response()->json([
            'message' => 'Organisation erfolgreich gelöscht.',
        ]);
    }
}
