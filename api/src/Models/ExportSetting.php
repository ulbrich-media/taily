<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * Export-related configuration as key/value pairs with a JSON value, one
 * row per setting. Shared by all export targets (key prefix = target).
 */
class ExportSetting extends Model
{
    use HasUuids;

    protected $fillable = ['key', 'value'];

    protected function casts(): array
    {
        return ['value' => 'array'];
    }
}
