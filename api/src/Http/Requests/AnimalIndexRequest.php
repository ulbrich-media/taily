<?php

namespace Taily\Http\Requests;

use Closure;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Query contract of the animal list (see docs/coding-patterns/list-views.md).
 *
 * `per_page=0` is a count-only request: the endpoint answers with the total of
 * the filtered query and no rows.
 */
class AnimalIndexRequest extends FormRequest
{
    public const DEFAULT_PER_PAGE = 25;

    public const MAX_PER_PAGE = 100;

    private const DEFAULT_SORT = '-created_at';

    private const SORT_KEYS = ['name', 'breed', 'color', 'created_at', 'updated_at', 'date_of_birth', 'animal_number'];

    // Derived from the animal's adoptions, see Animal::scopeWhereListStatus().
    private const STATUSES = ['open', 'in_progress', 'adopted'];

    private const FILTERS = [
        'animal_type_id',
        'status',
        'assigned_agent_id',
        'published',
        'neutered',
        'has_image',
        'boarding',
        'reserved',
        'has_sponsor',
    ];

    // Filters that accept several comma-separated values.
    private const MULTI_VALUE_FILTERS = ['status'];

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
            'filter.animal_type_id' => ['sometimes', 'uuid'],
            'filter.status' => ['sometimes', 'array'],
            'filter.status.*' => ['string', Rule::in(self::STATUSES)],
            // A person id, or `none` for animals without an assigned member.
            'filter.assigned_agent_id' => ['sometimes', 'string', function (string $attribute, mixed $value, Closure $fail) {
                if ($value !== 'none' && ! Str::isUuid($value)) {
                    $fail('Der Filter muss eine Id oder "none" sein.');
                }
            }],
            'filter.published' => ['sometimes', Rule::in(['0', '1'])],
            'filter.neutered' => ['sometimes', Rule::in(['0', '1'])],
            'filter.has_image' => ['sometimes', Rule::in(['0', '1'])],
            // "Only" flags: the filter is either set to 1 or absent.
            'filter.boarding' => ['sometimes', Rule::in(['1'])],
            'filter.reserved' => ['sometimes', Rule::in(['1'])],
            'filter.has_sponsor' => ['sometimes', Rule::in(['1'])],
        ];
    }

    /**
     * Multi-value filters arrive as `filter[status]=open,adopted`.
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
