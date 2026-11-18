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

    /** Our own marker for a delivery the platform rejected (HTTP 400). */
    public const STATUS_REJECTED = 'abgelehnt';

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
