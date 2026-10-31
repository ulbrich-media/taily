<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Taily\Enums\CustomFieldEntity;
use Taily\Http\Controllers\Controller;
use Taily\Http\Requests\CustomFieldGroupRequest;
use Taily\Http\Resources\CustomFieldGroupResource;
use Taily\Models\CustomFieldGroup;
use Taily\Support\CustomFields\CustomFieldCleanup;
use Taily\Support\CustomFields\CustomFieldDefinitions;

/**
 * Field Groups bind a form template to an entity as custom fields. Admin only.
 */
class CustomFieldGroupController extends Controller
{
    public function __construct(
        private CustomFieldDefinitions $definitions,
        private CustomFieldCleanup $cleanup,
    ) {}

    /**
     * All groups, in entity → section → position order. A small, bounded list.
     */
    public function index(): JsonResponse
    {
        $groups = collect(CustomFieldEntity::values())
            ->flatMap(fn ($entity) => $this->definitions->groups(CustomFieldEntity::from($entity)));

        return response()->json(['data' => CustomFieldGroupResource::collection($groups)]);
    }

    public function store(CustomFieldGroupRequest $request): JsonResponse
    {
        $group = DB::transaction(function () use ($request) {
            $group = CustomFieldGroup::create($request->safe()->except('animal_type_ids'));
            $group->animalTypes()->sync($request->validated('animal_type_ids'));

            return $group;
        });

        return response()->json([
            'message' => 'Zusatzfelder erfolgreich angelegt.',
            'data' => new CustomFieldGroupResource($this->fresh($group)),
        ], 201);
    }

    public function show(CustomFieldGroup $customFieldGroup): JsonResponse
    {
        return response()->json(['data' => new CustomFieldGroupResource($this->fresh($customFieldGroup))]);
    }

    /**
     * Changing a group's scope never deletes values: filled fields stay
     * visible outside the scope.
     */
    public function update(CustomFieldGroupRequest $request, CustomFieldGroup $customFieldGroup): JsonResponse
    {
        DB::transaction(function () use ($request, $customFieldGroup) {
            $customFieldGroup->update($request->safe()->except(['animal_type_ids', 'entity']));
            $customFieldGroup->animalTypes()->sync($request->validated('animal_type_ids'));
        });

        $this->definitions->flush();

        return response()->json([
            'message' => 'Zusatzfelder erfolgreich aktualisiert.',
            'data' => new CustomFieldGroupResource($this->fresh($customFieldGroup)),
        ]);
    }

    /**
     * Deleting a group deletes its values, so it needs the confirmation flag
     * whenever values exist (409 with the impact otherwise).
     */
    public function destroy(Request $request, CustomFieldGroup $customFieldGroup): JsonResponse
    {
        $customFieldGroup->load(['formTemplate.latestVersion', 'animalTypes']);
        $removals = $this->cleanup->groupDeletionImpact($customFieldGroup);

        if ($removals !== [] && ! $request->boolean(CustomFieldCleanup::CONFIRM_FLAG)) {
            return $this->cleanup->conflictResponse($removals);
        }

        DB::transaction(function () use ($customFieldGroup, $removals) {
            $this->cleanup->remove($removals);
            $customFieldGroup->delete();
        });

        return response()->json(['message' => 'Zusatzfelder erfolgreich gelöscht.']);
    }

    private function fresh(CustomFieldGroup $group): CustomFieldGroup
    {
        return $group->load(['formTemplate.latestVersion', 'animalTypes']);
    }
}
