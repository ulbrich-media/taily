<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Taily\Enums\CustomFieldEntity;
use Taily\Http\Controllers\Controller;
use Taily\Models\CustomFieldGroup;
use Taily\Support\CustomFields\CustomFieldDefinitions;
use Taily\Support\CustomFields\LinkableFields;

class CustomFieldController extends Controller
{
    public function __construct(private CustomFieldDefinitions $definitions) {}

    /**
     * The groups the admin UI renders for a record:
     * - `record_id`: the groups shown for that existing record
     * - otherwise: the in-scope groups for a new record (of `animal_type_id`)
     */
    public function definitions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'entity' => ['required', Rule::enum(CustomFieldEntity::class)],
            'animal_type_id' => ['nullable', 'uuid'],
            'record_id' => ['nullable', 'uuid'],
        ]);

        $entity = CustomFieldEntity::from($validated['entity']);

        if (! empty($validated['record_id'])) {
            $record = $entity->modelClass()::findOrFail($validated['record_id']);
            $groups = $this->definitions->shownFor($record);
        } else {
            $groups = $this->definitions->inScope($entity, $validated['animal_type_id'] ?? null)
                ->map(fn (CustomFieldGroup $group) => ['group' => $group, 'in_scope' => true])
                ->all();
        }

        return response()->json([
            'data' => array_values(array_map(fn (array $shown) => $this->definition($shown['group'], $shown['in_scope']), $groups)),
        ]);
    }

    /**
     * Fields a form template can link to ("Feld übernehmen"), with the schema
     * fragment and ui_schema entry the builder copies into the template.
     */
    public function linkable(Request $request, LinkableFields $linkable): JsonResponse
    {
        $validated = $request->validate(['entity' => ['required', Rule::enum(CustomFieldEntity::class)]]);

        return response()->json(['data' => $linkable->for(CustomFieldEntity::from($validated['entity']))]);
    }

    private function definition(CustomFieldGroup $group, bool $inScope): array
    {
        $version = $group->formTemplate?->latestVersion;

        return [
            'id' => $group->id,
            'title' => $group->title,
            'section' => $group->section,
            'position' => $group->position,
            'in_scope' => $inScope,
            'field_settings' => (object) ($group->field_settings ?? []),
            'template' => [
                'id' => $group->form_template_id,
                'version_id' => $version?->id,
                'schema' => $version?->schema,
                'ui_schema' => $version?->ui_schema,
            ],
        ];
    }
}
