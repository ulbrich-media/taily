<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class FormTemplate extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['name'];

    public function versions(): HasMany
    {
        return $this->hasMany(FormTemplateVersion::class);
    }

    public function latestVersion(): HasOne
    {
        return $this->hasOne(FormTemplateVersion::class)->latestOfMany('version');
    }
}
