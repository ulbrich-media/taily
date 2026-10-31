<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Taily\Support\CustomFields\CustomFieldDefinitions;

class FormTemplateVersion extends Model
{
    use HasUuids;

    protected $fillable = [
        'form_template_id',
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

    protected static function booted(): void
    {
        // Custom field definitions read the latest version; keep the per-request
        // memo in sync when a bound template changes.
        static::saved(fn () => app(CustomFieldDefinitions::class)->flush());
    }

    public function formTemplate(): BelongsTo
    {
        return $this->belongsTo(FormTemplate::class);
    }

    public function formSubmissions(): HasMany
    {
        return $this->hasMany(FormSubmission::class);
    }

    public static function latestVersionNumberFor(string $formTemplateId): int
    {
        return static::where('form_template_id', $formTemplateId)->max('version') ?? 0;
    }
}
