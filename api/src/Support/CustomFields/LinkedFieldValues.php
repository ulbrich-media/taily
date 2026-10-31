<?php

namespace Taily\Support\CustomFields;

use Taily\Models\FormSubmission;

/**
 * Reads the values of linked fields out of a form submission, grouped by
 * target entity and kind, so the accept/approve flows (#231, #241) can pre-fill
 * the person and animal forms. Links do nothing on their own.
 */
class LinkedFieldValues
{
    /**
     * @return array<string, array{core: array<string, mixed>, custom: array<string, mixed>}>
     */
    public static function extract(FormSubmission $submission): array
    {
        $version = $submission->formTemplateVersion;

        return self::fromData($version?->ui_schema ?? [], $submission->data ?? []);
    }

    /**
     * @param  array<string, mixed>  $uiSchema
     * @param  array<string, mixed>  $data
     * @return array<string, array{core: array<string, mixed>, custom: array<string, mixed>}>
     */
    public static function fromData(array $uiSchema, array $data): array
    {
        $result = [];

        foreach ($uiSchema as $key => $entry) {
            $link = is_array($entry) ? ($entry['ui:options']['link'] ?? null) : null;

            if (! is_array($link) || ! array_key_exists($key, $data) || CustomFieldValues::isEmpty($data[$key])) {
                continue;
            }

            [$kind, $field] = array_pad(explode('.', (string) ($link['field'] ?? ''), 2), 2, '');

            if (! in_array($kind, ['core', 'custom'], true) || $field === '') {
                continue;
            }

            $entity = (string) ($link['entity'] ?? '');
            $result[$entity] ??= ['core' => [], 'custom' => []];
            $result[$entity][$kind][$field] = $data[$key];
        }

        return $result;
    }
}
