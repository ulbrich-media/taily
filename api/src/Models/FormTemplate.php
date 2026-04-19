<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FormTemplate extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'type',
        'name',
        'schema',
        'ui_schema',
        'version',
    ];

    protected function casts(): array
    {
        return [
            'schema' => 'array',
            'ui_schema' => 'array',
            'version' => 'integer',
        ];
    }

    /**
     * Scope to filter by type.
     */
    public function scopeOfType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    /**
     * Get the previous version of this template (version - 1).
     */
    public function previousVersion(): ?static
    {
        if ($this->version <= 1) {
            return null;
        }

        return static::where('type', $this->type)
            ->where('version', $this->version - 1)
            ->first();
    }

    /**
     * Get the latest version number for a given type.
     */
    public static function latestVersionForType(string $type): int
    {
        return static::where('type', $type)->max('version') ?? 0;
    }
}
