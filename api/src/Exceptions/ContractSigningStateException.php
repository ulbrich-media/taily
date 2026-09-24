<?php

namespace Taily\Exceptions;

use RuntimeException;

/**
 * Thrown when a contract signing transition is attempted against a process
 * that is no longer (or not yet) in the state that transition requires —
 * e.g. a signature submitted after the process was already cancelled.
 */
class ContractSigningStateException extends RuntimeException {}
