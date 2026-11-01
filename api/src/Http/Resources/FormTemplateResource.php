<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FormTemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $version = $this->resource->latestVersion;

        return [
            'id' => $this->resource->id,
            'name' => $this->resource->name,
            'version' => $version?->version,
            'version_id' => $version?->id,
            'schema' => $version?->schema,
            'ui_schema' => $version?->ui_schema,
            'submissions_count' => $this->resource->form_submissions_count ?? 0,
            'created_at' => $this->resource->created_at,
            'updated_at' => $version?->updated_at ?? $this->resource->updated_at,
            'custom_field_groups' => $this->whenLoaded('customFieldGroups', fn () => $this->resource->customFieldGroups
                ->map(fn ($group) => [
                    'id' => $group->id,
                    'entity' => $group->entity->value,
                    'section' => $group->section,
                    'title' => $group->title,
                ])->values()->all(), []),
            'versions' => $this->whenLoaded(
                'versions',
                fn () => FormTemplateVersionResource::collection($this->resource->versions)
            ),
        ];
    }
}
