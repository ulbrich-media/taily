<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;

class AdoptionDetailResource extends AdoptionBaseResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'animal' => $this->whenLoaded('animal', fn ($a) => new AnimalDetailResource($a)),
            'mediator' => $this->whenLoaded('mediator', fn ($m) => new PersonListResource($m)),
            'applicant' => $this->whenLoaded('applicant', fn ($m) => new PersonDetailResource($m)),
        ]);
    }
}
