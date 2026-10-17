<?php

namespace Taily\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

/**
 * Query contract shared by the smaller list views (see
 * docs/coding-patterns/list-views.md). A list declares its sort keys, filters
 * and whether it can be searched; everything else is handled here.
 *
 * `per_page=0` is a count-only request: the endpoint answers with the total of
 * the filtered query and no rows.
 *
 * Without any list parameter the endpoint keeps answering with the whole
 * list, which the pickers in other forms still rely on, see wantsListView().
 */
abstract class ListIndexRequest extends FormRequest
{
    public const DEFAULT_PER_PAGE = 25;

    public const MAX_PER_PAGE = 100;

    /** Query parameters that switch an endpoint from the full list to the list-view contract. */
    public const LIST_PARAMETERS = ['page', 'per_page', 'sort', 'search', 'filter'];

    /**
     * Sort keys a client may ask for. Empty when the list has a fixed order.
     *
     * @return list<string>
     */
    protected function sortKeys(): array
    {
        return [];
    }

    protected function defaultSort(): string
    {
        return '';
    }

    protected function searchable(): bool
    {
        return false;
    }

    /**
     * Validation rules of the `filter.*` parameters, keyed by their full name
     * (`filter.role`). The names are the whitelist of filters.
     *
     * @return array<string, mixed>
     */
    protected function filterRules(): array
    {
        return [];
    }

    /**
     * Names of the filters that accept several comma-separated values.
     *
     * @return list<string>
     */
    protected function multiValueFilters(): array
    {
        return [];
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sorts = array_merge($this->sortKeys(), array_map(fn (string $key) => '-'.$key, $this->sortKeys()));

        return [
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:0', 'max:'.self::MAX_PER_PAGE],
            'sort' => $sorts === [] ? ['prohibited'] : ['sometimes', Rule::in($sorts)],
            'search' => $this->searchable() ? ['sometimes', 'nullable', 'string', 'max:100'] : ['prohibited'],
            'filter' => ['sometimes', 'array'],
            ...$this->filterRules(),
        ];
    }

    /**
     * Multi-value filters arrive as `filter[role]=admin,user`.
     */
    protected function prepareForValidation(): void
    {
        $filter = $this->input('filter');

        if (! is_array($filter)) {
            return;
        }

        foreach ($this->multiValueFilters() as $name) {
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

                $known = array_map(
                    fn (string $rule) => substr($rule, strlen('filter.')),
                    array_filter(array_keys($this->filterRules()), fn (string $rule) => ! str_ends_with($rule, '.*')),
                );

                foreach (array_diff(array_keys($filter), $known) as $name) {
                    $validator->errors()->add("filter.{$name}", 'Unbekannter Filter.');
                }
            },
        ];
    }

    /**
     * Answer of a count-only request (`per_page=0`): the total, no rows.
     *
     * @param  Builder<Model>  $query
     */
    public function countResponse(Builder $query): JsonResponse
    {
        return response()->json([
            'data' => [],
            'meta' => [
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => 0,
                'total' => $query->count(),
            ],
        ]);
    }

    /**
     * The validated input as a plain map: the rules are assembled from the
     * subclass hooks, so Psalm cannot derive their shape.
     *
     * @return array<string, mixed>
     */
    private function validatedInput(): array
    {
        return $this->validated();
    }

    public function wantsListView(): bool
    {
        return $this->hasAny(self::LIST_PARAMETERS);
    }

    /**
     * @return array<string, string|list<string>>
     */
    public function filters(): array
    {
        return $this->validatedInput()['filter'] ?? [];
    }

    public function searchTerm(): ?string
    {
        return $this->validatedInput()['search'] ?? null;
    }

    public function perPage(): int
    {
        return (int) ($this->validatedInput()['per_page'] ?? self::DEFAULT_PER_PAGE);
    }

    public function sortKey(): string
    {
        return ltrim($this->validatedInput()['sort'] ?? $this->defaultSort(), '-');
    }

    public function sortDirection(): string
    {
        return str_starts_with($this->validatedInput()['sort'] ?? $this->defaultSort(), '-') ? 'desc' : 'asc';
    }
}
