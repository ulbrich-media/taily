<?php

namespace Taily\Http\Responses;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\FailedPasswordResetResponse as FailedPasswordResetResponseContract;

/**
 * Reports every failed reset as an invalid token. The broker distinguishes
 * between an unknown email and a bad token, but exposing that difference
 * would let the endpoint be used to probe which emails have an account.
 */
class FailedPasswordResetResponse implements FailedPasswordResetResponseContract
{
    public function __construct(
        protected string $status
    ) {}

    /**
     * Create an HTTP response that represents the object.
     *
     * @param  Request  $request
     * @return never
     */
    public function toResponse($request)
    {
        throw ValidationException::withMessages([
            'email' => [trans(Password::INVALID_TOKEN)],
        ]);
    }
}
