<?php

namespace Taily\Support;

use Illuminate\Support\Facades\DB;
use Taily\Models\FormTemplate;

class FormTemplateService
{
    public function __construct(
        private JsonSchemaValidator $schemaValidator,
        private SchemaChangeAnalyzer $changeAnalyzer,
    ) {}

    /**
     * Create a new form template version for a type.
     * If no version exists for the type yet, starts at version 1.
     */
    public function createTemplate(array $data): FormTemplate
    {
        return DB::transaction(function () use ($data) {
            $nextVersion = FormTemplate::latestVersionForType($data['type']) + 1;

            return FormTemplate::create([
                'type' => $data['type'],
                'name' => $data['name'],
                'schema' => $data['schema'],
                'ui_schema' => $data['ui_schema'] ?? null,
                'version' => $nextVersion,
            ]);
        });
    }

    /**
     * Update a form template, automatically deciding whether to bump the version.
     *
     * A new version is created when the schema change is breaking (e.g. removed
     * properties, type changes, new required fields, tightened constraints).
     * Non-breaking changes (text edits, adding optional fields) update in place.
     *
     * Returns the saved template and a flag indicating whether a new version was created.
     *
     * @return array{template: FormTemplate, new_version_created: bool}
     */
    public function updateTemplate(FormTemplate $template, array $data): array
    {
        $newVersionRequired = $this->changeAnalyzer->requiresNewVersion(
            $template->schema,
            $data['schema']
        );

        if (! $newVersionRequired) {
            $template->update([
                'name' => $data['name'],
                'schema' => $data['schema'],
                'ui_schema' => $data['ui_schema'] ?? $template->ui_schema,
            ]);

            return ['template' => $template->fresh(), 'new_version_created' => false];
        }

        $newTemplate = DB::transaction(function () use ($template, $data) {
            $nextVersion = FormTemplate::latestVersionForType($template->type) + 1;

            return FormTemplate::create([
                'type' => $template->type,
                'name' => $data['name'],
                'schema' => $data['schema'],
                'ui_schema' => $data['ui_schema'] ?? null,
                'version' => $nextVersion,
            ]);
        });

        return ['template' => $newTemplate, 'new_version_created' => true];
    }

    /**
     * Validate submitted data against a template's schema.
     *
     * @param  array  $data  Submitted form data
     * @return array{valid: bool, errors: array<string, mixed>}
     */
    public function validateSubmissionData(FormTemplate $template, array $data): array
    {
        return $this->schemaValidator->validate($template->schema, $data);
    }
}
