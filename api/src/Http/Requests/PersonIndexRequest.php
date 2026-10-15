<?php

namespace Taily\Http\Requests;

use Closure;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Query contract of the people list (see docs/coding-patterns/list-views.md).
 *
 * `per_page=0` is a count-only request: the endpoint answers with the total of
 * the filtered query and no rows.
 */
class PersonIndexRequest extends FormRequest
{
    public const DEFAULT_PER_PAGE = 25;

    public const MAX_PER_PAGE = 100;

    /** Query parameters that switch the endpoint from the legacy full list to the list-view contract. */
    public const LIST_PARAMETERS = ['page', 'per_page', 'sort', 'search', 'filter'];

    private const DEFAULT_SORT = 'name';

    private const SORT_KEYS = ['name', 'organization', 'city', 'roles', 'created_at', 'updated_at'];

    public const ROLES = ['inspector', 'foster', 'mediator'];

    // Adoptions of the person as applicant, `in_progress` covers pending ones too.
    private const ADOPTION_STATUSES = ['in_progress', 'done', 'canceled'];

    private const FILTERS = ['role', 'organization_id', 'has_adoptions', 'has_pre_inspections', 'adoption_status'];

    // Filters that accept several comma-separated values.
    private const MULTI_VALUE_FILTERS = ['role', 'adoption_status'];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sorts = array_merge(self::SORT_KEYS, array_map(fn (string $key) => '-'.$key, self::SORT_KEYS));

        return [
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:0', 'max:'.self::MAX_PER_PAGE],
            'sort' => ['sometimes', Rule::in($sorts)],
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],

            'filter' => ['sometimes', 'array'],
            // `none`, a role (`mediator`) or a role for one animal type (`mediator:<animal type id>`).
            'filter.role' => ['sometimes', 'array'],
            'filter.role.*' => ['string', function (string $attribute, mixed $value, Closure $fail) {
                [$role, $animalType] = array_pad(explode(':', $value, 2), 2, null);

                $valid = $value === 'none'
                    || (in_array($role, self::ROLES, true) && ($animalType === null || Str::isUuid($animalType)));

                if (! $valid) {
                    $fail('Die Rolle ist ungültig.');
                }
            }],
            // An organization id, or `none` for people without one.
            'filter.organization_id' => ['sometimes', 'string', function (string $attribute, mixed $value, Closure $fail) {
                if ($value !== 'none' && ! Str::isUuid($value)) {
                    $fail('Der Filter muss eine Id oder "none" sein.');
                }
            }],
            'filter.has_adoptions' => ['sometimes', Rule::in(['0', '1'])],
            'filter.has_pre_inspections' => ['sometimes', Rule::in(['0', '1'])],
            'filter.adoption_status' => ['sometimes', 'array'],
            'filter.adoption_status.*' => ['string', Rule::in(self::ADOPTION_STATUSES)],
        ];
    }

    /**
     * Multi-value filters arrive as `filter[role]=mediator,inspector:<id>`.
     */
    protected function prepareForValidation(): void
    {
        $filter = $this->input('filter');

        if (! is_array($filter)) {
            return;
        }

        foreach (self::MULTI_VALUE_FILTERS as $name) {
            if (isset($filter[$name]) && is_string($filter[$name])) {
                $filter[$name] = array_values(array_filter(explode(',', $filter[$name]), fn (string $value) => $value !== ''));
            }
        }

        $this->merge(['filter' => $filter]);
    }

    /**
     * Unknown filters are rejected rather than silently ignored.
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                $filter = $this->input('filter');

                if (! is_array($filter)) {
                    return;
                }

                foreach (array_diff(array_keys($filter), self::FILTERS) as $name) {
                    $validator->errors()->add("filter.{$name}", 'Unbekannter Filter.');
                }
            },
        ];
    }

    /**
     * Whether the client asked for the list-view contract. Without any of its
     * parameters the endpoint keeps answering with the whole directory.
     */
    public function wantsListView(): bool
    {
        return $this->hasAny(self::LIST_PARAMETERS);
    }

    /**
     * @return array<string, string|list<string>>
     */
    public function filters(): array
    {
        return $this->validated()['filter'] ?? [];
    }

    public function searchTerm(): ?string
    {
        return $this->validated()['search'] ?? null;
    }

    public function perPage(): int
    {
        return (int) ($this->validated()['per_page'] ?? self::DEFAULT_PER_PAGE);
    }

    public function sortKey(): string
    {
        return ltrim($this->validated()['sort'] ?? self::DEFAULT_SORT, '-');
    }

    public function sortDirection(): string
    {
        return str_starts_with($this->validated()['sort'] ?? self::DEFAULT_SORT, '-') ? 'desc' : 'asc';
    }
}
