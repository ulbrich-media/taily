<?php

namespace Taily\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Taily\Models\FormTemplateVersion;
use Taily\Models\PreInspection;

class PreInspectionService
{
    public function __construct(
        private FormTemplateService $formTemplateService,
    ) {}

    /**
     * Validate form_data against a template version's schema.
     * Throws ValidationException with namespaced keys ("form_data.*") on failure.
     */
    public function validateFormDataOrFail(FormTemplateVersion $version, array $data): void
    {
        $result = $this->formTemplateService->validateSubmissionData($version, $data);

        if (! $result['valid']) {
            throw ValidationException::withMessages(
                collect($result['errors'])
                    ->mapWithKeys(fn ($msgs, $key) => ["form_data.{$key}" => $msgs])
                    ->toArray()
            );
        }
    }

    /**
     * First-time submission: create the FormSubmission (if a template version exists),
     * set verdict and notes, stamp submitted_at — all in one transaction.
     */
    public function submitFirstTime(
        PreInspection $inspection,
        string $verdict,
        string $notes,
        ?array $formData,
        ?FormTemplateVersion $version,
    ): void {
        DB::transaction(function () use ($inspection, $verdict, $notes, $formData, $version) {
            if ($version) {
                $inspection->formSubmission()->create([
                    'form_template_version_id' => $version->id,
                    'data' => $formData ?? [],
                ]);
            }

            $inspection->verdict = $verdict;
            $inspection->notes = $notes;
            $inspection->submitted_at = now();
            $inspection->save();
        });
    }

    /**
     * Post-submission edit: update verdict, notes, and/or form_data freely.
     * $changes is the validated request array; keys absent from the array are left untouched.
     */
    public function updateAfterSubmission(PreInspection $inspection, array $changes): void
    {
        if (array_key_exists('form_data', $changes)) {
            if ($changes['form_data'] === null) {
                throw ValidationException::withMessages([
                    'form_data' => ['Formulardaten dürfen nicht leer sein.'],
                ]);
            }
            $inspection->load('formSubmission.formTemplateVersion');
            $submission = $inspection->formSubmission;
            $version = $submission?->formTemplateVersion;

            if ($version) {
                $this->validateFormDataOrFail($version, $changes['form_data']);
                $submission->update(['data' => $changes['form_data']]);
            }
        }

        if (array_key_exists('verdict', $changes)) {
            $inspection->verdict = $changes['verdict'];
        }
        if (array_key_exists('notes', $changes)) {
            $inspection->notes = $changes['notes'];
        }
        $inspection->save();
    }
}
