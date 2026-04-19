<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends Model
{
    use HasFactory, HasUuids;

    protected $attributes = [
        'email' => '',
        'street_line' => '',
        'street_line_additional' => '',
        'postal_code' => '',
        'city' => '',
        'country_code' => '',
        'phone' => '',
        'mobile' => '',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'street_line',
        'street_line_additional',
        'postal_code',
        'city',
        'country_code',
        'phone',
        'mobile',
    ];

    /**
     * Get the people belonging to this organization.
     */
    public function people(): HasMany
    {
        return $this->hasMany(Person::class);
    }
}
