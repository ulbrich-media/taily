<?php

namespace Taily\Http\Requests;

use Illuminate\Validation\Rule;

/**
 * Query contract of the vaccination and medical test lists (see
 * ListIndexRequest). Both are one merged list, ordered by animal type and
 * then by title, so there is no sort parameter.
 */
class AnimalTypeItemIndexRequest extends ListIndexRequest
{
    protected function filterRules(): array
    {
        return [
            'filter.animal_type_id' => ['sometimes', 'uuid', Rule::exists('animal_types', 'id')],
        ];
    }
}
