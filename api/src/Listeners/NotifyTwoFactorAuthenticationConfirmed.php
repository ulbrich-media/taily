<?php

namespace Taily\Listeners;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Laravel\Fortify\Events\TwoFactorAuthenticationConfirmed;
use Taily\Mail\SecurityNotificationMail;
use Taily\Models\User;
use Throwable;

class NotifyTwoFactorAuthenticationConfirmed
{
    /**
     * Handle the event.
     */
    public function handle(TwoFactorAuthenticationConfirmed $event): void
    {
        if (! $event->user instanceof User) {
            return;
        }

        // 2FA is already confirmed at this point, so a mail delivery failure
        // must not turn into a 500 for the user.
        try {
            Mail::to($event->user->email)->send(new SecurityNotificationMail(
                'Zwei-Faktor-Authentifizierung aktiviert',
                'Die Zwei-Faktor-Authentifizierung wurde für dein Konto aktiviert.'
            ));
        } catch (Throwable $e) {
            Log::error('Failed to send two-factor authentication enabled security notification', [
                'user_id' => $event->user->id,
                'exception' => $e,
            ]);
        }
    }
}
