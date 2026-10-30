<?php

namespace Taily\Http\Requests;

/**
 * Query contract of the lists that only page through their rows, in a fixed
 * order: animal types and form templates (see ListIndexRequest).
 */
class CatalogIndexRequest extends ListIndexRequest {}
