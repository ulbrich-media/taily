<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FormTemplateVersionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'form_template_id' => $this->resource->form_template_id,
            'version' => $this->resource->version,
            'submissions_count' => $this->resource->form_submissions_count ?? 0,
            'schema' => $this->resource->schema,
            'ui_schema' => $this->resource->ui_schema,
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
        ];
    }
}
