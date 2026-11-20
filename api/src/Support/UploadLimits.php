<?php

namespace Taily\Support;

/**
 * Single source of truth for upload size limits.
 *
 * KB values feed the validation `max:` rules; maxBytes() feeds
 * media-library's `max_file_size`, so the two can't drift apart.
 */
final class UploadLimits
{
    public const IMAGE_KB = 10240;

    public const VIDEO_KB = 102400;

    public const CONTRACT_KB = 20480;

    /** Largest validated upload, in bytes (media-library `max_file_size`). */
    public static function maxBytes(): int
    {
        return max(self::IMAGE_KB, self::VIDEO_KB, self::CONTRACT_KB) * 1024;
    }
}
