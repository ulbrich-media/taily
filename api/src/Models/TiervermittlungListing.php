<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * The local record of an animal sent to Tiervermittlung.de: what the
 * platform answered on the last delivery and the hash of the payload that
 * was sent, so unchanged animals are not sent again on every run.
 */
class TiervermittlungListing extends Model
{
    use HasUuids;

    /**
     * Our own marker for an animal whose deliveries the platform rejected
     * (HTTP 400) before it ever accepted one, so there is no listing.
     */
    public const STATUS_REJECTED = 'abgelehnt';

    /** Statuses the platform reports back. */
    public const STATUS_PUBLISHED = 'veroeffentlicht';

    public const STATUS_UNPUBLISHED = 'nicht_veroeffentlicht';

    public const STATUS_DUPLICATE = 'doppelt';

    /** No delivery accepted yet. */
    public const STATUS_NONE = '';

    protected $attributes = [
        'status' => '',
        'url' => '',
        'payload_hash' => '',
        'last_error' => '',
    ];

    protected $fillable = [
        'animal_id',
        'tier_id',
        'status',
        'tv_id',
        'url',
        'payload_hash',
        'reasons',
        'warnings',
        'last_error',
        'last_sent_at',
    ];

    protected function casts(): array
    {
        return [
            'tv_id' => 'integer',
            'reasons' => 'array',
            'warnings' => 'array',
            'last_sent_at' => 'datetime',
        ];
    }

    public function animal(): BelongsTo
    {
        return $this->belongsTo(Animal::class);
    }
}
