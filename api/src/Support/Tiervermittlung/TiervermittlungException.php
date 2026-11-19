<?php

namespace Taily\Support\Tiervermittlung;

use RuntimeException;

/**
 * A failed call to the Tiervermittlung.de API. The platform answers errors
 * as `{"fehler": "...", "feld": "..."}`; both are kept for display.
 */
class TiervermittlungException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly ?int $status = null,
        public readonly ?string $field = null,
    ) {
        parent::__construct($message);
    }

    /** The key is missing, wrong, revoked, or the account is not enabled. */
    public function isAuthError(): bool
    {
        return $this->status === 401 || $this->status === 403;
    }

    /** The payload itself was rejected; sending it again will not help. */
    public function isRejection(): bool
    {
        return $this->status === 400;
    }

    public function isNotFound(): bool
    {
        return $this->status === 404;
    }

    /**
     * The message as shown to an admin: the platform's own text, with the
     * offending field when it named one.
     */
    public function describe(): string
    {
        return $this->field ? "{$this->getMessage()} (Feld: {$this->field})" : $this->getMessage();
    }
}
