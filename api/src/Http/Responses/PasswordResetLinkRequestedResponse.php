<?php

namespace Taily\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\FailedPasswordResetLinkRequestResponse;
use Laravel\Fortify\Contracts\SuccessfulPasswordResetLinkRequestResponse;

/**
 * Answers every reset link request identically, whether or not the email
 * belongs to a user (or the broker throttled a repeated request), so the
 * endpoint cannot be used to probe which email addresses have an account.
 */
class PasswordResetLinkRequestedResponse implements FailedPasswordResetLinkRequestResponse, SuccessfulPasswordResetLinkRequestResponse
{
    public function __construct(
        protected string $status
    ) {}

    /**
     * Create an HTTP response that represents the object.
     *
     * @param  Request  $request
     */
    public function toResponse($request): JsonResponse
    {
        return new JsonResponse([
            'message' => 'Wenn ein Konto mit dieser E-Mail-Adresse existiert, wurde ein Link zum Zurücksetzen des Passworts gesendet.',
        ]);
    }
}
