<?php

namespace Taily\Listeners;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Laravel\Fortify\Events\TwoFactorAuthenticationDisabled;
use Taily\Mail\SecurityNotificationMail;
use Taily\Models\User;
use Throwable;

class NotifyTwoFactorAuthenticationDisabled
{
    /**
     * Handle the event.
     */
    public function handle(TwoFactorAuthenticationDisabled $event): void
    {
        if (! $event->user instanceof User) {
            return;
        }

        // 2FA is already disabled at this point, so a mail delivery failure
        // must not turn into a 500 for the user.
        try {
            Mail::to($event->user->email)->send(new SecurityNotificationMail(
                'Zwei-Faktor-Authentifizierung deaktiviert',
                'Die Zwei-Faktor-Authentifizierung wurde für dein Konto deaktiviert.'
            ));
        } catch (Throwable $e) {
            Log::error('Failed to send two-factor authentication disabled security notification', [
                'user_id' => $event->user->id,
                'exception' => $e,
            ]);
        }
    }
}
