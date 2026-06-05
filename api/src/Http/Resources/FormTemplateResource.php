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
            'versions' => $this->whenLoaded(
                'versions',
                fn () => FormTemplateVersionResource::collection($this->resource->versions)
            ),
        ];
    }
}
