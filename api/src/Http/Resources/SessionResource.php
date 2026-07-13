<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Wraps a raw `sessions` table row (see config/session.php) for the active
 * sessions list. `is_current_device` is set on the row by the controller
 * before wrapping, since that requires comparing against the request's own
 * session id — not something derivable from the row alone.
 *
 * @property string $id
 * @property string|null $ip_address
 * @property string|null $user_agent
 * @property bool $is_current_device
 * @property int $last_activity
 */
class SessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => hash('sha256', $this->id),
            'ip_address' => $this->ip_address,
            'browser' => $this->guessBrowser($this->user_agent),
            'platform' => $this->guessPlatform($this->user_agent),
            'is_current_device' => $this->is_current_device,
            'last_active_at' => date(DATE_ATOM, $this->last_activity),
        ];
    }

    /**
     * Rough browser guess from the user agent string. Good enough for a
     * device list; not meant to be a full UA parser.
     */
    private function guessBrowser(?string $userAgent): ?string
    {
        if (! $userAgent) {
            return null;
        }

        return match (true) {
            (bool) preg_match('/Edg\//', $userAgent) => 'Edge',
            (bool) preg_match('/OPR\/|Opera/', $userAgent) => 'Opera',
            (bool) preg_match('/Firefox\//', $userAgent) => 'Firefox',
            (bool) preg_match('/CriOS\//', $userAgent) => 'Chrome',
            (bool) preg_match('/Chrome\//', $userAgent) => 'Chrome',
            (bool) preg_match('/Safari\//', $userAgent) => 'Safari',
            default => null,
        };
    }

    /**
     * Rough OS/platform guess from the user agent string.
     */
    private function guessPlatform(?string $userAgent): ?string
    {
        if (! $userAgent) {
            return null;
        }

        return match (true) {
            (bool) preg_match('/iPhone|iPad|iPod/', $userAgent) => 'iOS',
            (bool) preg_match('/Android/', $userAgent) => 'Android',
            (bool) preg_match('/Mac OS X/', $userAgent) => 'macOS',
            (bool) preg_match('/Windows/', $userAgent) => 'Windows',
            (bool) preg_match('/Linux/', $userAgent) => 'Linux',
            default => null,
        };
    }
}
