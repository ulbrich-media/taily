<?php

namespace Taily\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use Taily\Enums\CustomFieldEntity;
use Taily\Enums\CustomFieldPersonRole;
use Taily\Models\CustomFieldGroup;
use Taily\Models\FormTemplate;
use Taily\Support\CustomFields\CustomFieldKeys;

class CustomFieldGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $entity = CustomFieldEntity::tryFrom((string) $this->input('entity'));

        return [
            'entity' => ['required', Rule::enum(CustomFieldEntity::class)],
            'section' => ['required', 'string', Rule::in(array_keys($entity?->sections() ?? []))],
            'animal_type_ids' => ['present', 'array', $entity === CustomFieldEntity::PERSON ? 'max:0' : 'nullable'],
            'animal_type_ids.*' => ['uuid', 'distinct', 'exists:animal_types,id'],
            'person_roles' => ['present', 'array', $entity === CustomFieldEntity::ANIMAL ? 'max:0' : 'nullable'],
            'person_roles.*' => ['string', 'distinct', Rule::in(CustomFieldPersonRole::values())],
            'form_template_id' => [
                'required', 'uuid', 'exists:form_templates,id',
                Rule::unique('custom_field_groups')
                    ->where('entity', $entity?->value)
                    ->ignore($this->group()?->id),
            ],
            'title' => ['required', 'string', 'max:255'],
            'position' => ['required', 'integer', 'min:0'],
            'field_settings' => ['present', 'array'],
            'field_settings.*.public' => ['sometimes', 'boolean'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            $group = $this->group();
            $entity = CustomFieldEntity::tryFrom((string) $this->input('entity'));

            if ($group && $entity && $group->entity !== $entity) {
                $validator->errors()->add('entity', 'Die Entität einer Gruppe kann nicht geändert werden.');
            }

            if (! $entity || $validator->errors()->has('form_template_id')) {
                return;
            }

            $template = FormTemplate::with('latestVersion')->find($this->input('form_template_id'));
            $keys = array_keys($template?->latestVersion?->schema['properties'] ?? []);

            if ($conflict = app(CustomFieldKeys::class)->conflict($entity, $keys, $group?->id)) {
                $validator->errors()->add('form_template_id', $conflict);
            }
        }];
    }

    public function messages(): array
    {
        return [
            'form_template_id.unique' => 'Diese Formularvorlage ist für diese Entität bereits als Zusatzfelder gebunden.',
            'animal_type_ids.max' => 'Personengruppen können nicht auf Tierarten beschränkt werden.',
            'person_roles.max' => 'Tiergruppen können nicht auf Rollen beschränkt werden.',
        ];
    }

    private function group(): ?CustomFieldGroup
    {
        $group = $this->route('custom_field_group');

        return $group instanceof CustomFieldGroup ? $group : null;
    }
}
