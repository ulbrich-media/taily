<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Taily\Models\Concerns\SearchesWithLike;

class Organization extends Model
{
    use HasFactory, HasUuids, SearchesWithLike;

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

    /**
     * Match the name, email, city or country code.
     */
    public function scopeSearch(Builder $query, ?string $term): void
    {
        $term = trim((string) $term);

        if ($term === '') {
            return;
        }

        $query->where(function (Builder $search) use ($term) {
            foreach (['name', 'email', 'city', 'country_code'] as $column) {
                self::whereLike($search, "organizations.{$column}", $term, 'or');
            }
        });
    }
}
