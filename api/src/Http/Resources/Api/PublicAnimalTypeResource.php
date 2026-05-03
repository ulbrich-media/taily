<?php

namespace Taily\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicAnimalTypeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'vaccinations' => $this->vaccinations->map(fn ($v) => [
                'id' => $v->id,
                'title' => $v->title,
                'description' => $v->description,
            ]),
            'medical_tests' => $this->medicalTests->map(fn ($t) => [
                'id' => $t->id,
                'title' => $t->title,
                'description' => $t->description,
            ]),
        ];
    }
}
