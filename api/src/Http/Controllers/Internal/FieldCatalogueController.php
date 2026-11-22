<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Taily\Http\Controllers\Controller;
use Taily\Models\AnimalType;
use Taily\Models\FieldDefinition;
use Taily\Models\FieldGroup;
use Taily\Support\CaseFile\FieldCatalogue;

/**
 * Administration of an animal type's Case File catalogue: groups, fields,
 * their order and copying from another animal type. Reading is open to every
 * user; changes are for admins.
 */
class FieldCatalogueController extends Controller
{
    public function __construct(
        private FieldCatalogue $catalogue,
    ) {
        $this->middleware('admin')->except(['show']);
    }

    public function show(AnimalType $animalType): JsonResponse
    {
        return response()->json($this->present($animalType));
    }

    public function storeGroup(Request $request, AnimalType $animalType): JsonResponse
    {
        $this->catalogue->createGroup($animalType, $request->all());

        return $this->respond($animalType, 'Abschnitt angelegt.', 201);
    }

    public function updateGroup(Request $request, FieldGroup $fieldGroup): JsonResponse
    {
        $this->catalogue->updateGroup($fieldGroup, $request->all());

        return $this->respond($fieldGroup->animalType, 'Abschnitt gespeichert.');
    }

    public function destroyGroup(FieldGroup $fieldGroup): JsonResponse
    {
        $animalType = $fieldGroup->animalType;
        $this->catalogue->deleteGroup($fieldGroup);

        return $this->respond($animalType, 'Abschnitt gelöscht.');
    }

    public function reorderGroups(Request $request, AnimalType $animalType): JsonResponse
    {
        $validated = $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['uuid']]);
        $this->catalogue->reorderGroups($animalType, $validated['ids']);

        return $this->respond($animalType, 'Reihenfolge gespeichert.');
    }

    public function storeField(Request $request, FieldGroup $fieldGroup): JsonResponse
    {
        $this->catalogue->createField($fieldGroup, $request->all());

        return $this->respond($fieldGroup->animalType, 'Feld angelegt.', 201);
    }

    public function updateField(Request $request, FieldDefinition $fieldDefinition): JsonResponse
    {
        $this->catalogue->updateField($fieldDefinition, $request->all());

        return $this->respond($fieldDefinition->animalType, 'Feld gespeichert.');
    }

    public function reorderFields(Request $request, FieldGroup $fieldGroup): JsonResponse
    {
        $validated = $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['uuid']]);
        $this->catalogue->reorderFields($fieldGroup, $validated['ids']);

        return $this->respond($fieldGroup->animalType, 'Reihenfolge gespeichert.');
    }

    public function archiveField(FieldDefinition $fieldDefinition): JsonResponse
    {
        $this->catalogue->archiveField($fieldDefinition);

        return $this->respond($fieldDefinition->animalType, 'Feld archiviert.');
    }

    public function restoreField(FieldDefinition $fieldDefinition): JsonResponse
    {
        $this->catalogue->restoreField($fieldDefinition);

        return $this->respond($fieldDefinition->animalType, 'Feld wiederhergestellt.');
    }

    public function copy(Request $request, AnimalType $animalType): JsonResponse
    {
        $validated = $request->validate(['from_animal_type_id' => ['required', 'uuid', 'exists:animal_types,id']]);
        $this->catalogue->copy(AnimalType::findOrFail($validated['from_animal_type_id']), $animalType);

        return $this->respond($animalType, 'Katalog kopiert.');
    }

    private function respond(AnimalType $animalType, string $message, int $status = 200): JsonResponse
    {
        return response()->json(['message' => $message, 'data' => $this->present($animalType)], $status);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(AnimalType $animalType): array
    {
        $groups = FieldGroup::where('animal_type_id', $animalType->id)
            ->orderBy('position')
            ->with('fieldDefinitions')
            ->get();

        return [
            'animal_type' => ['id' => $animalType->id, 'title' => $animalType->title],
            'groups' => $groups->map(fn (FieldGroup $group) => [
                'id' => $group->id,
                'title' => $group->title,
                'intro' => $group->intro,
                'fields' => $group->fieldDefinitions->map(fn (FieldDefinition $field) => [
                    'id' => $field->id,
                    'key' => $field->key,
                    'label' => $field->label,
                    'help' => $field->help,
                    'type' => $field->type->value,
                    'options' => $field->options,
                    'built_in' => $field->isBuiltIn(),
                    'collect_at' => $field->collect_at->value,
                    'required_for' => $field->required_for?->value,
                    'requires_review' => $field->requires_review,
                    'visible_to_applicant' => $field->visible_to_applicant,
                    'visible_to_inspector' => $field->visible_to_inspector,
                    'condition' => $field->condition,
                    'archived_at' => $field->archived_at,
                ])->values(),
            ])->values(),
        ];
    }
}
