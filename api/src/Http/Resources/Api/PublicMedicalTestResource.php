<?php

namespace Taily\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicMedicalTestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'title' => $this->resource->title,
            'description' => $this->resource->description,
            'tested_at' => $this->resource->pivot->tested_at,
            'result' => $this->resource->pivot->result,
        ];
    }
}
