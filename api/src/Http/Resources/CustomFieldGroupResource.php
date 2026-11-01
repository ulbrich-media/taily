<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Taily\Support\CustomFields\CustomFieldDefinition;

class CustomFieldGroupResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $group = $this->resource;

        return [
            'id' => $group->id,
            'entity' => $group->entity->value,
            'section' => $group->section,
            'title' => $group->title,
            'position' => $group->position,
            'animal_type_ids' => $group->animalTypes->pluck('id')->values()->all(),
            'animal_types' => $group->animalTypes->map(fn ($type) => ['id' => $type->id, 'title' => $type->title])->values()->all(),
            'person_roles' => $group->person_roles ?? [],
            'form_template_id' => $group->form_template_id,
            'form_template' => $group->formTemplate ? ['id' => $group->formTemplate->id, 'name' => $group->formTemplate->name] : null,
            'field_settings' => (object) ($group->field_settings ?? []),
            'fields' => array_map(fn (CustomFieldDefinition $field) => [
                'key' => $field->key,
                'label' => $field->label(),
                'type' => $field->type(),
            ], $group->fieldDefinitions()),
            'created_at' => $group->created_at,
            'updated_at' => $group->updated_at,
        ];
    }
}
