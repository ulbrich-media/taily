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
                $formTemplate = $animalType->preInspectionFormTemplate;
                $latestVersion = $formTemplate?->latestVersion;

                return $latestVersion ? [
                    'id' => $formTemplate->id,
                    'name' => $formTemplate->name,
                    'schema' => $latestVersion->schema,
                    'ui_schema' => $latestVersion->ui_schema,
                ] : null;
            }),
            'form_submission' => $this->whenLoaded('formSubmission', function ($submission) {
                if (! $submission) {
                    return null;
                }

                $version = $submission->formTemplateVersion;

                return [
                    'form_template_version_id' => $submission->form_template_version_id,
                    'data' => $submission->data,
                    'template' => $version ? [
                        'id' => $version->form_template_id,
                        'schema' => $version->schema,
                        'ui_schema' => $version->ui_schema,
                    ] : null,
                ];
            }),
        ]);
    }
}
