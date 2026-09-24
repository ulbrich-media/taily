<?php

namespace Taily\Exceptions;

use RuntimeException;

/**
 * Thrown when the frozen unsigned PDF no longer hashes to the
 * `unsigned_document_hash` recorded when the signing process started.
 *
 * Deliberately not a ContractSigningStateException: that one maps to the
 * public "link is invalid, expired or already used" response, which would be
 * a misleading thing to tell a signer whose document has been altered on
 * disk. This surfaces as a failure instead, so the mismatch is noticed rather
 * than absorbed — Taily refuses to assemble a final contract around a body it
 * can no longer vouch for.
 */
class ContractDocumentIntegrityException extends RuntimeException {}
