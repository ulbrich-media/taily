<?php

namespace Taily\Http\Requests;

/**
 * Query contract of the organization list (see ListIndexRequest). Searchable,
 * always ordered by name.
 */
class OrganizationIndexRequest extends ListIndexRequest
{
    protected function searchable(): bool
    {
        return true;
    }
}
