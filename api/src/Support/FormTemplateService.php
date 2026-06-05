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
     * Breaking schema changes create a new version.
     *
     * @return array{template: FormTemplate, new_version_created: bool}
     */
    public function updateTemplate(FormTemplate $template, FormTemplateVersion $currentVersion, array $data): array
    {
        $newVersionRequired = $this->changeAnalyzer->requiresNewVersion(
            $currentVersion->schema,
            $data['schema']
        );

        $template->update(['name' => $data['name']]);

        if (! $newVersionRequired) {
            $currentVersion->update([
                'schema' => $data['schema'],
                'ui_schema' => $data['ui_schema'] ?? $currentVersion->ui_schema,
            ]);

            return ['template' => $template->load('latestVersion'), 'new_version_created' => false];
        }

        DB::transaction(function () use ($template, $data) {
            $nextVersion = FormTemplateVersion::latestVersionNumberFor($template->id) + 1;

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
