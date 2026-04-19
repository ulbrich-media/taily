<?php

namespace Taily\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Taily\Support\JsonSchemaValidator;

class UpdateFormTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'schema' => ['required', 'array'],
            'schema.type' => ['required_without_all:schema.properties,schema.$schema', 'string'],
            'ui_schema' => ['nullable', 'array'],
        ];
    }

    /**
     * Laravel's validated() only returns explicitly declared nested keys, so the
     * bulk of the schema (properties, required, x-options, …) would be stripped.
     * We restore the full schema from input after it has passed all validation rules.
     */
    public function validated($key = null, $default = null): array
    {
        $data = parent::validated($key, $default);

        if (is_null($key)) {
            if ($this->has('schema')) {
                $data['schema'] = $this->input('schema');
            }
            if ($this->has('ui_schema')) {
                $data['ui_schema'] = $this->input('ui_schema');
            }
        }

        return $data;
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->has('schema') && is_array($this->input('schema'))) {
                $schemaValidator = app(JsonSchemaValidator::class);
                if (! $schemaValidator->isValidSchema($this->input('schema'))) {
                    $validator->errors()->add('schema', 'Das Schema muss ein gültiges JSON Schema sein (mit "type", "properties" oder "$schema").');
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Der Formularname ist erforderlich.',
            'schema.required' => 'Das Schema ist erforderlich.',
            'schema.array' => 'Das Schema muss ein JSON-Objekt sein.',
        ];
    }
}
