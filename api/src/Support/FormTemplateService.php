<?php

namespace Taily\Support;

use Illuminate\Support\Facades\DB;
use Taily\Models\FormTemplate;
use Taily\Models\FormTemplateVersion;

class FormTemplateService
{
    public function __construct(
        private JsonSchemaValidator $schemaValidator,
        private SchemaChangeAnalyzer $changeAnalyzer,
    ) {}

    /**
     * Create a new form template with its initial version.
     *
     * @param  array{name: string, schema: array<string, mixed>, ui_schema?: array<string, mixed>|null}  $data
     */
    public function createTemplate(array $data): FormTemplate
    {
        return DB::transaction(function () use ($data) {
            $template = FormTemplate::create(['name' => $data['name']]);

            $template->versions()->create([
                'schema' => $data['schema'],
                'ui_schema' => $data['ui_schema'] ?? null,
                'version' => 1,
            ]);

            return $template->load('latestVersion');
        });
    }

    /**
     * Update a form template. Non-breaking changes update the current version in place.
     * Breaking schema changes create a new version. A version without submissions can be
     * updated with breaking changes as well.
     *
     * @param  array{name: string, schema: array<string, mixed>, ui_schema?: array<string, mixed>|null}  $data
     * @return array{template: FormTemplate, new_version_created: bool}
     */
    public function updateTemplate(FormTemplate $template, FormTemplateVersion $currentVersion, array $data): array
    {
        $newVersionRequired = $this->changeAnalyzer->requiresNewVersion(
            $currentVersion->schema,
            $data['schema']
        );

        // If the change is non-breaking, or breaking but the version has no submissions yet
        // (no existing data can be invalidated), update the current version in place.
        if (! $newVersionRequired || ! $currentVersion->formSubmissions()->exists()) {
            $template->update(['name' => $data['name']]);
            $currentVersion->update([
                'schema' => $data['schema'],
                'ui_schema' => array_key_exists('ui_schema', $data) ? $data['ui_schema'] : $currentVersion->ui_schema,
            ]);

            return ['template' => $template->load('latestVersion'), 'new_version_created' => false];
        }

        DB::transaction(function () use ($template, $data) {
            $template->update(['name' => $data['name']]);
            $nextVersion = FormTemplateVersion::latestVersionNumberFor((string) $template->id) + 1;

            $template->versions()->create([
                'schema' => $data['schema'],
                'ui_schema' => $data['ui_schema'] ?? null,
                'version' => $nextVersion,
            ]);
        });

        return ['template' => $template->load('latestVersion'), 'new_version_created' => true];
    }

    /**
     * Validate submitted data against a template version's schema.
     *
     * @return array{valid: bool, errors: array<string, mixed>}
     */
    public function validateSubmissionData(FormTemplateVersion $version, array $data): array
    {
        return $this->schemaValidator->validate($version->schema, $data);
    }
}
