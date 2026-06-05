<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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

    public function formTemplate(): BelongsTo
    {
        return $this->belongsTo(FormTemplate::class);
    }

    public static function latestVersionNumberFor(string $formTemplateId): int
    {
        return static::where('form_template_id', $formTemplateId)->max('version') ?? 0;
    }
}
