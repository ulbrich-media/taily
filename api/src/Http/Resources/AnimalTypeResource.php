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
            'form_template_id' => $this->resource->form_template_id,
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
            'form_template' => $this->whenLoaded('formTemplate', fn ($v) => $v ? new FormTemplateResource($v) : null),
        ];
    }
}
