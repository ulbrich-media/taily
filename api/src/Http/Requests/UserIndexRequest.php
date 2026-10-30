<?php

namespace Taily\Http\Requests;

use Illuminate\Validation\Rule;
use Taily\Enums\UserRole;

/**
 * Query contract of the user list (see ListIndexRequest).
 *
 * Two-factor and login state are only visible to admins (see UserResource),
 * so only admins may filter or sort by them. Everyone else gets a 422 instead
 * of a way to probe other accounts.
 */
class UserIndexRequest extends ListIndexRequest
{
    private const SORT_KEYS = ['name', 'email', 'created_at'];

    private const ADMIN_SORT_KEYS = ['last_login_at'];

    protected function sortKeys(): array
    {
        return $this->isAdmin() ? [...self::SORT_KEYS, ...self::ADMIN_SORT_KEYS] : self::SORT_KEYS;
    }

    protected function defaultSort(): string
    {
        return 'name';
    }

    protected function searchable(): bool
    {
        return true;
    }

    protected function multiValueFilters(): array
    {
        return ['role'];
    }

    protected function filterRules(): array
    {
        $rules = [
            'filter.role' => ['sometimes', 'array'],
            'filter.role.*' => ['string', Rule::enum(UserRole::class)],
            'filter.has_person' => ['sometimes', Rule::in(['0', '1'])],
        ];

        if ($this->isAdmin()) {
            $rules['filter.has_two_factor'] = ['sometimes', Rule::in(['0', '1'])];
            $rules['filter.has_logged_in'] = ['sometimes', Rule::in(['0', '1'])];
        }

        return $rules;
    }

    private function isAdmin(): bool
    {
        return (bool) $this->user()?->isAdmin();
    }
}
