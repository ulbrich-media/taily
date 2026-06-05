<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AnimalTypeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'title' => $this->resource->title,
            'pre_inspection_form_template_id' => $this->resource->pre_inspection_form_template_id,
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
            'pre_inspection_form_template' => $this->whenLoaded('preInspectionFormTemplate', fn ($v) => $v ? new FormTemplateResource($v) : null),
        ];
    }
}
