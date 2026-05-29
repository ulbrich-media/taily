<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;

class AdoptionDetailResource extends AdoptionBaseResource
{
    public function toArray(Request $request): array
    {
        $contractMedia = $this->resource->getFirstMedia('contract');

        return array_merge(parent::toArray($request), [
            'animal' => $this->whenLoaded('animal', fn ($a) => new AnimalDetailResource($a)),
            'mediator' => $this->whenLoaded('mediator', fn ($m) => new PersonListResource($m)),
            'applicant' => $this->whenLoaded('applicant', fn ($m) => new PersonDetailResource($m)),
            'transport' => $this->whenLoaded('transport', fn ($t) => $t ? [
                'id' => $t->id,
                'planned_at' => $t->planned_at,
                'done_at' => $t->done_at,
                'is_done' => $t->isDone(),
            ] : null),
            'contract_file' => $contractMedia ? [
                'uuid' => $contractMedia->uuid,
                'name' => $contractMedia->file_name,
                'url' => $contractMedia->getTemporaryUrl(now()->addHour()),
            ] : null,
        ]);
    }
}
