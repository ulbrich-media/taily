<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Taily\Support\FrontendUriBuilder;

class PreInspectionDetailResource extends PreInspectionBaseResource
{
    public function toArray(Request $request): array
    {
        $token = $this->activeToken();

        return array_merge(parent::toArray($request), [
            'status' => $this->resource->status,
            'submission_url' => $token ? FrontendUriBuilder::inspect($token->token) : null,
            'person' => $this->whenLoaded('person', fn ($v) => new PersonBaseResource($v)),
            'animal_type' => $this->whenLoaded('animalType', fn ($v) => new AnimalTypeResource($v)),
            'inspector' => $this->whenLoaded('inspector', fn ($v) => $v ? new PersonBaseResource($v) : null),
            'pre_inspection_form_template' => $this->whenLoaded('animalType', function ($animalType) {
                $template = $animalType->preInspectionFormTemplate;

                return $template ? [
                    'id' => $template->id,
                    'name' => $template->name,
                    'schema' => $template->schema,
                    'ui_schema' => $template->ui_schema,
                ] : null;
            }),
            'form_submission' => $this->whenLoaded('formSubmission', function ($submission) {
                if (! $submission) {
                    return null;
                }

                $template = $submission->formTemplate;

                return [
                    'form_template_id' => $submission->form_template_id,
                    'data' => $submission->data,
                    'template' => $template ? [
                        'schema' => $template->schema,
                        'ui_schema' => $template->ui_schema,
                    ] : null,
                ];
            }),
        ]);
    }
}
